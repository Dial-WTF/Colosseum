use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("BC11111111111111111111111111111111111111111");

#[program]
pub mod bonding_curve {
    use super::*;

    /// Initialize a new bonding curve for an NFT collection
    pub fn initialize_curve(
        ctx: Context<InitializeCurve>,
        curve_type: CurveType,
        base_price: u64,
        price_increment: u64,
        max_supply: u32,
        bezier_min_price: Option<u64>,
        bezier_max_price: Option<u64>,
    ) -> Result<()> {
        let curve = &mut ctx.accounts.bonding_curve;
        
        curve.authority = ctx.accounts.authority.key();
        curve.collection_mint = ctx.accounts.collection_mint.key();
        curve.curve_type = curve_type.clone();
        curve.base_price = base_price;
        curve.price_increment = price_increment;
        curve.max_supply = max_supply;
        curve.current_supply = 0;
        curve.total_volume = 0;
        curve.bump = ctx.bumps.bonding_curve;
        
        // Set Bezier prices if provided
        curve.bezier_min_price = bezier_min_price.unwrap_or(base_price);
        curve.bezier_max_price = bezier_max_price.unwrap_or(base_price);

        msg!("Bonding curve initialized for collection: {}", curve.collection_mint);
        msg!("Type: {:?}, Base: {} lamports, Increment: {}", curve_type, base_price, price_increment);
        
        if curve_type == CurveType::Bezier {
            msg!("Bezier range: {} to {} lamports", curve.bezier_min_price, curve.bezier_max_price);
        }
        
        Ok(())
    }

    /// Mint a new edition with bonding curve pricing
    pub fn mint_edition(
        ctx: Context<MintEdition>,
    ) -> Result<()> {
        let curve = &mut ctx.accounts.bonding_curve;
        
        // Check if max supply reached
        require!(
            curve.current_supply < curve.max_supply,
            BondingCurveError::MaxSupplyReached
        );

        // Calculate current price based on curve
        let current_price = calculate_price(
            &curve.curve_type,
            curve.base_price,
            curve.price_increment,
            curve.current_supply + 1, // Next edition number
            curve.bezier_min_price,
            curve.bezier_max_price,
            curve.max_supply,
        )?;

        msg!("Minting edition #{} at {} lamports", curve.current_supply + 1, current_price);

        // Transfer payment from buyer to creator
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.buyer.key(),
            &curve.authority,
            current_price,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.buyer.to_account_info(),
                ctx.accounts.authority_account.to_account_info(),
            ],
        )?;

        // Mint NFT token to buyer
        let cpi_accounts = MintTo {
            mint: ctx.accounts.edition_mint.to_account_info(),
            to: ctx.accounts.buyer_token_account.to_account_info(),
            authority: ctx.accounts.bonding_curve.to_account_info(),
        };
        
        let seeds = &[
            b"bonding_curve",
            curve.collection_mint.as_ref(),
            &[curve.bump],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        
        token::mint_to(cpi_ctx, 1)?;

        // Update curve state
        curve.current_supply += 1;
        curve.total_volume += current_price;

        msg!("Edition #{} minted successfully!", curve.current_supply);
        msg!("Total volume: {} lamports", curve.total_volume);

        Ok(())
    }

    /// Update bonding curve parameters (authority only)
    pub fn update_curve(
        ctx: Context<UpdateCurve>,
        new_base_price: Option<u64>,
        new_price_increment: Option<u64>,
        new_max_supply: Option<u32>,
    ) -> Result<()> {
        let curve = &mut ctx.accounts.bonding_curve;
        
        if let Some(base_price) = new_base_price {
            curve.base_price = base_price;
            msg!("Updated base price to: {} lamports", base_price);
        }
        
        if let Some(increment) = new_price_increment {
            curve.price_increment = increment;
            msg!("Updated price increment to: {} lamports", increment);
        }
        
        if let Some(max_supply) = new_max_supply {
            require!(
                max_supply >= curve.current_supply,
                BondingCurveError::InvalidMaxSupply
            );
            curve.max_supply = max_supply;
            msg!("Updated max supply to: {}", max_supply);
        }

        Ok(())
    }

    /// Close the bonding curve and reclaim rent (authority only, must be empty)
    pub fn close_curve(ctx: Context<CloseCurve>) -> Result<()> {
        let curve = &ctx.accounts.bonding_curve;
        
        require!(
            curve.current_supply == 0,
            BondingCurveError::CurveNotEmpty
        );

        msg!("Closing bonding curve for collection: {}", curve.collection_mint);
        
        Ok(())
    }

    /// Initialize a Bezier price lookup table for complex curves
    /// Stores pre-calculated prices for each edition to avoid on-chain computation
    pub fn initialize_bezier_lookup(
        ctx: Context<InitializeBezierLookup>,
        prices: Vec<u64>, // Pre-calculated price for each edition
    ) -> Result<()> {
        let lookup = &mut ctx.accounts.bezier_lookup;
        
        require!(
            prices.len() as u32 <= ctx.accounts.bonding_curve.max_supply,
            BondingCurveError::InvalidPriceLookup
        );
        
        lookup.bonding_curve = ctx.accounts.bonding_curve.key();
        lookup.prices = prices;
        lookup.bump = ctx.bumps.bezier_lookup;

        msg!("Bezier price lookup initialized with {} entries", lookup.prices.len());
        
        Ok(())
    }

    /// Mint edition using Bezier lookup table
    pub fn mint_edition_with_bezier_lookup(
        ctx: Context<MintEditionWithBezierLookup>,
    ) -> Result<()> {
        let curve = &mut ctx.accounts.bonding_curve;
        let lookup = &ctx.accounts.bezier_lookup;
        
        // Check if max supply reached
        require!(
            curve.current_supply < curve.max_supply,
            BondingCurveError::MaxSupplyReached
        );

        // Get pre-calculated price from lookup table
        let edition_idx = curve.current_supply as usize;
        let current_price = lookup.prices.get(edition_idx)
            .ok_or(BondingCurveError::PriceNotFound)?;

        msg!("Minting edition #{} at {} lamports (from lookup)", curve.current_supply + 1, current_price);

        // Transfer payment from buyer to creator
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.buyer.key(),
            &curve.authority,
            *current_price,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.buyer.to_account_info(),
                ctx.accounts.authority_account.to_account_info(),
            ],
        )?;

        // Mint NFT token to buyer
        let cpi_accounts = MintTo {
            mint: ctx.accounts.edition_mint.to_account_info(),
            to: ctx.accounts.buyer_token_account.to_account_info(),
            authority: ctx.accounts.bonding_curve.to_account_info(),
        };
        
        let seeds = &[
            b"bonding_curve",
            curve.collection_mint.as_ref(),
            &[curve.bump],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        
        token::mint_to(cpi_ctx, 1)?;

        // Update curve state
        curve.current_supply += 1;
        curve.total_volume += current_price;

        msg!("Edition #{} minted successfully with Bezier lookup!", curve.current_supply);
        msg!("Total volume: {} lamports", curve.total_volume);

        Ok(())
    }
}

// Calculate price based on curve type and edition number
fn calculate_price(
    curve_type: &CurveType,
    base_price: u64,
    price_increment: u64,
    edition: u32,
    bezier_min_price: u64,
    bezier_max_price: u64,
    max_supply: u32,
) -> Result<u64> {
    let price = match curve_type {
        CurveType::Linear => {
            // price = base_price + (edition - 1) * increment
            base_price
                .checked_add((edition as u64 - 1).checked_mul(price_increment).unwrap())
                .unwrap()
        }
        CurveType::Exponential => {
            // price = base_price * (1 + increment)^(edition - 1)
            // Simplified: price = base_price + (base_price * increment * (edition - 1) / 10000)
            let multiplier = price_increment.checked_mul(edition as u64 - 1).unwrap() / 10000;
            base_price
                .checked_add(base_price.checked_mul(multiplier).unwrap())
                .unwrap()
        }
        CurveType::Logarithmic => {
            // price = base_price + increment * log2(edition)
            // Approximation for on-chain
            let log_edition = (edition as f64).log2() as u64;
            base_price
                .checked_add(price_increment.checked_mul(log_edition).unwrap())
                .unwrap()
        }
        CurveType::Bezier => {
            // For Bezier, we use the lookup table approach
            // The price_increment field stores the pre-calculated price for this edition
            // This allows for complex curves without expensive on-chain computation
            // Client must provide the correct price based on off-chain Bezier evaluation
            
            // Simple interpolation between min and max based on supply progression
            // For more complex curves, use BezierPriceLookup account (see below)
            let progress = (edition as u64 * 10000) / max_supply as u64; // 0-10000 (0-100%)
            let price_range = bezier_max_price.checked_sub(bezier_min_price).unwrap();
            let price_delta = price_range.checked_mul(progress).unwrap() / 10000;
            
            bezier_min_price.checked_add(price_delta).unwrap()
        }
    };

    Ok(price)
}

#[derive(Accounts)]
pub struct InitializeCurve<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + BondingCurve::INIT_SPACE,
        seeds = [b"bonding_curve", collection_mint.key().as_ref()],
        bump
    )]
    pub bonding_curve: Account<'info, BondingCurve>,
    
    pub collection_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintEdition<'info> {
    #[account(
        mut,
        seeds = [b"bonding_curve", bonding_curve.collection_mint.as_ref()],
        bump = bonding_curve.bump
    )]
    pub bonding_curve: Account<'info, BondingCurve>,
    
    #[account(mut)]
    pub edition_mint: Account<'info, Mint>,
    
    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = edition_mint,
        associated_token::authority = buyer
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    /// CHECK: Authority receives payment
    #[account(mut, constraint = authority_account.key() == bonding_curve.authority)]
    pub authority_account: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct UpdateCurve<'info> {
    #[account(
        mut,
        seeds = [b"bonding_curve", bonding_curve.collection_mint.as_ref()],
        bump = bonding_curve.bump,
        constraint = bonding_curve.authority == authority.key() @ BondingCurveError::Unauthorized
    )]
    pub bonding_curve: Account<'info, BondingCurve>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct CloseCurve<'info> {
    #[account(
        mut,
        close = authority,
        seeds = [b"bonding_curve", bonding_curve.collection_mint.as_ref()],
        bump = bonding_curve.bump,
        constraint = bonding_curve.authority == authority.key() @ BondingCurveError::Unauthorized
    )]
    pub bonding_curve: Account<'info, BondingCurve>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct InitializeBezierLookup<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 4 + (8 * 1000) + 1, // Max 1000 prices
        seeds = [b"bezier_lookup", bonding_curve.key().as_ref()],
        bump
    )]
    pub bezier_lookup: Account<'info, BezierPriceLookup>,
    
    #[account(
        constraint = bonding_curve.curve_type == CurveType::Bezier @ BondingCurveError::InvalidCurveType,
        constraint = bonding_curve.authority == authority.key() @ BondingCurveError::Unauthorized
    )]
    pub bonding_curve: Account<'info, BondingCurve>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintEditionWithBezierLookup<'info> {
    #[account(
        mut,
        seeds = [b"bonding_curve", bonding_curve.collection_mint.as_ref()],
        bump = bonding_curve.bump
    )]
    pub bonding_curve: Account<'info, BondingCurve>,
    
    #[account(
        seeds = [b"bezier_lookup", bonding_curve.key().as_ref()],
        bump = bezier_lookup.bump
    )]
    pub bezier_lookup: Account<'info, BezierPriceLookup>,
    
    #[account(mut)]
    pub edition_mint: Account<'info, Mint>,
    
    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = edition_mint,
        associated_token::authority = buyer
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    /// CHECK: Authority receives payment
    #[account(mut, constraint = authority_account.key() == bonding_curve.authority)]
    pub authority_account: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[account]
#[derive(InitSpace)]
pub struct BondingCurve {
    pub authority: Pubkey,          // 32
    pub collection_mint: Pubkey,    // 32
    pub curve_type: CurveType,      // 1
    pub base_price: u64,            // 8
    pub price_increment: u64,       // 8
    pub max_supply: u32,            // 4
    pub current_supply: u32,        // 4
    pub total_volume: u64,          // 8
    pub bump: u8,                   // 1
    // Bezier curve: min and max prices
    pub bezier_min_price: u64,      // 8
    pub bezier_max_price: u64,      // 8
}

/// Lookup table for pre-calculated Bezier prices
/// Used for complex curves to avoid expensive on-chain computation
#[account]
pub struct BezierPriceLookup {
    pub bonding_curve: Pubkey,      // 32
    pub prices: Vec<u64>,           // 4 + (n * 8) - price for each edition
    pub bump: u8,                   // 1
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum CurveType {
    Linear,
    Exponential,
    Logarithmic,
    Bezier,
}

#[error_code]
pub enum BondingCurveError {
    #[msg("Maximum supply has been reached")]
    MaxSupplyReached,
    #[msg("Unauthorized: Only the authority can perform this action")]
    Unauthorized,
    #[msg("Invalid max supply: must be greater than or equal to current supply")]
    InvalidMaxSupply,
    #[msg("Curve is not empty: cannot close while supply exists")]
    CurveNotEmpty,
    #[msg("Arithmetic overflow in price calculation")]
    ArithmeticOverflow,
    #[msg("Invalid price lookup: number of prices exceeds max supply")]
    InvalidPriceLookup,
    #[msg("Price not found in lookup table for this edition")]
    PriceNotFound,
    #[msg("Invalid curve type for this operation")]
    InvalidCurveType,
}

