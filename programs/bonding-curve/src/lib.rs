use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("8KQf2fczuHCXXMWZnVogCS971rpuBxmMia93qg1BdP8G");

#[program]
pub mod bonding_curve {
    use super::*;

    /// Initialize a new bonding curve
    pub fn initialize_curve(
        ctx: Context<InitializeCurve>,
        base_price: u64,
        price_increment: u64,
        max_supply: u32,
    ) -> Result<()> {
        let curve = &mut ctx.accounts.bonding_curve;
        curve.authority = ctx.accounts.authority.key();
        curve.collection_mint = ctx.accounts.collection_mint.key();
        curve.base_price = base_price;
        curve.price_increment = price_increment;
        curve.max_supply = max_supply;
        curve.current_supply = 0;
        curve.total_volume = 0;
        curve.bump = ctx.bumps.bonding_curve;
        Ok(())
    }

    /// Mint edition with linear bonding curve (NO Metaplex - just basic SPL token)
    pub fn mint_edition(
        ctx: Context<MintEdition>,
    ) -> Result<()> {
        let collection_mint = ctx.accounts.bonding_curve.collection_mint;
        let bump = ctx.accounts.bonding_curve.bump;
        let authority = ctx.accounts.bonding_curve.authority;
        let bonding_curve_info = ctx.accounts.bonding_curve.to_account_info();
        
        let curve = &mut ctx.accounts.bonding_curve;
        
        require!(
            curve.current_supply < curve.max_supply,
            BondingCurveError::MaxSupplyReached
        );

        // LINEAR: price = base + (supply * increment)
        let current_price = curve.base_price
            .checked_add((curve.current_supply as u64)
                .checked_mul(curve.price_increment)
                .ok_or(BondingCurveError::ArithmeticOverflow)?)
            .ok_or(BondingCurveError::ArithmeticOverflow)?;

        // Transfer payment
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.buyer.key(),
            &authority,
            current_price,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.buyer.to_account_info(),
                ctx.accounts.authority_account.to_account_info(),
            ],
        )?;

        // Mint token
        let seeds = &[b"bonding_curve", collection_mint.as_ref(), &[bump]];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = MintTo {
            mint: ctx.accounts.edition_mint.to_account_info(),
            to: ctx.accounts.buyer_token_account.to_account_info(),
            authority: bonding_curve_info,
        };
        
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer
        );
        
        token::mint_to(cpi_ctx, 1)?;

        curve.current_supply += 1;
        curve.total_volume += current_price;
        
        Ok(())
    }

    /// Get current price
    pub fn get_price(ctx: Context<GetPrice>) -> Result<u64> {
        let curve = &ctx.accounts.bonding_curve;
        Ok(curve.base_price + (curve.current_supply as u64 * curve.price_increment))
    }
}

#[derive(Accounts)]
pub struct InitializeCurve<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 97,
        seeds = [b"bonding_curve", collection_mint.key().as_ref()],
        bump
    )]
    pub bonding_curve: Account<'info, BondingCurve>,
    
    /// CHECK: Collection mint
    pub collection_mint: AccountInfo<'info>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
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
pub struct GetPrice<'info> {
    pub bonding_curve: Account<'info, BondingCurve>,
}

#[account]
pub struct BondingCurve {
    pub authority: Pubkey,          // 32
    pub collection_mint: Pubkey,    // 32
    pub base_price: u64,            // 8
    pub price_increment: u64,       // 8
    pub max_supply: u32,            // 4
    pub current_supply: u32,        // 4
    pub total_volume: u64,          // 8
    pub bump: u8,                   // 1
}

#[error_code]
pub enum BondingCurveError {
    #[msg("Max supply reached")]
    MaxSupplyReached,
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
}

