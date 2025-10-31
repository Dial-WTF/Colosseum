use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo};
use anchor_spl::associated_token::AssociatedToken;
use mpl_token_metadata::{
    instructions::{CreateMetadataAccountV3, CreateMetadataAccountV3InstructionArgs, CreateMasterEditionV3, CreateMasterEditionV3InstructionArgs},
    types::{DataV2, Creator},
};

declare_id!("6FJfw1jiB8enNmeRt5V2uFfTc6XS1gR8TpqXQ5rDJnCF");

#[program]
pub mod bonding_curve {
    use super::*;

    /// Initialize a new bonding curve for an NFT collection
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

    /// Mint a new edition with linear bonding curve pricing + Metaplex metadata
    pub fn mint_edition(
        ctx: Context<MintEdition>,
        name: String,
        symbol: String,
        uri: String,
        seller_fee_basis_points: u16,
    ) -> Result<()> {
        // Capture ALL values and account infos before mutable borrow
        let collection_mint = ctx.accounts.bonding_curve.collection_mint;
        let bump = ctx.accounts.bonding_curve.bump;
        let bonding_curve_key = ctx.accounts.bonding_curve.key();
        let authority = ctx.accounts.bonding_curve.authority;
        let bonding_curve_info = ctx.accounts.bonding_curve.to_account_info();
        
        let curve = &mut ctx.accounts.bonding_curve;
        
        // Check if max supply reached
        require!(
            curve.current_supply < curve.max_supply,
            BondingCurveError::MaxSupplyReached
        );

        // Calculate LINEAR price: base_price + (supply * increment)
        let current_price = curve.base_price
            .checked_add(
                curve.current_supply
                    .checked_mul(curve.price_increment as u32)
                    .ok_or(BondingCurveError::ArithmeticOverflow)? as u64
            )
            .ok_or(BondingCurveError::ArithmeticOverflow)?;


        // Transfer payment from buyer to creator
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

        // Mint NFT token to buyer
        let seeds = &[
            b"bonding_curve",
            collection_mint.as_ref(),
            &[bump],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = MintTo {
            mint: ctx.accounts.edition_mint.to_account_info(),
            to: ctx.accounts.buyer_token_account.to_account_info(),
            authority: bonding_curve_info.clone(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        
        token::mint_to(cpi_ctx, 1)?;


        // Create Metaplex metadata account
        let creator = Creator {
            address: authority,
            verified: false,
            share: 100,
        };

        let data_v2 = DataV2 {
            name: name.clone(),
            symbol: symbol.clone(),
            uri: uri.clone(),
            seller_fee_basis_points,
            creators: Some(vec![creator]),
            collection: Some(mpl_token_metadata::types::Collection {
                verified: false,
                key: ctx.accounts.collection_mint.key(),
            }),
            uses: None,
        };

        let create_metadata_ix = CreateMetadataAccountV3 {
            metadata: ctx.accounts.edition_metadata.key(),
            mint: ctx.accounts.edition_mint.key(),
            mint_authority: bonding_curve_key,
            payer: ctx.accounts.buyer.key(),
            update_authority: (bonding_curve_key, true),
            system_program: ctx.accounts.system_program.key(),
            rent: None,
        };

        let create_metadata_args = CreateMetadataAccountV3InstructionArgs {
            data: data_v2,
            is_mutable: true,
            collection_details: None,
        };

        let create_metadata_account_ix = create_metadata_ix.instruction(create_metadata_args);

        anchor_lang::solana_program::program::invoke_signed(
            &create_metadata_account_ix,
            &[
                ctx.accounts.edition_metadata.to_account_info(),
                ctx.accounts.edition_mint.to_account_info(),
                bonding_curve_info.clone(),
                ctx.accounts.buyer.to_account_info(),
                bonding_curve_info.clone(),
                ctx.accounts.system_program.to_account_info(),
            ],
            signer,
        )?;


        // Create Master Edition
        let create_master_edition_ix = CreateMasterEditionV3 {
            edition: ctx.accounts.edition_master_edition.key(),
            mint: ctx.accounts.edition_mint.key(),
            update_authority: bonding_curve_key,
            mint_authority: bonding_curve_key,
            payer: ctx.accounts.buyer.key(),
            metadata: ctx.accounts.edition_metadata.key(),
            token_program: ctx.accounts.token_program.key(),
            system_program: ctx.accounts.system_program.key(),
            rent: None,
        };

        let create_master_edition_args = CreateMasterEditionV3InstructionArgs {
            max_supply: Some(0), // 0 means unique 1/1 NFT
        };

        let create_master_edition_account_ix = create_master_edition_ix.instruction(create_master_edition_args);

        anchor_lang::solana_program::program::invoke_signed(
            &create_master_edition_account_ix,
            &[
                ctx.accounts.edition_master_edition.to_account_info(),
                ctx.accounts.edition_mint.to_account_info(),
                bonding_curve_info.clone(),
                bonding_curve_info.clone(),
                ctx.accounts.buyer.to_account_info(),
                ctx.accounts.edition_metadata.to_account_info(),
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            signer,
        )?;

        // Update curve state
        curve.current_supply += 1;
        curve.total_volume += current_price;

        Ok(())
    }

    /// Get current price for next edition
    pub fn get_price(
        ctx: Context<GetPrice>,
    ) -> Result<()> {
        let curve = &ctx.accounts.bonding_curve;
        
        let price = curve.base_price
            .checked_add(
                curve.current_supply
                    .checked_mul(curve.price_increment as u32)
                    .ok_or(BondingCurveError::ArithmeticOverflow)? as u64
            )
            .ok_or(BondingCurveError::ArithmeticOverflow)?;
        
        Ok(())
    }

    /// Close the bonding curve (only if supply is 0)
    pub fn close_curve(
        ctx: Context<CloseCurve>,
    ) -> Result<()> {
        let curve = &ctx.accounts.bonding_curve;
        
        require!(
            curve.current_supply == 0,
            BondingCurveError::CurveNotEmpty
        );
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeCurve<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 8 + 8 + 4 + 4 + 8 + 1,
        seeds = [b"bonding_curve", collection_mint.key().as_ref()],
        bump
    )]
    pub bonding_curve: Account<'info, BondingCurve>,
    
    /// CHECK: Collection mint address
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
    
    /// CHECK: Metadata account (created by Metaplex CPI)
    #[account(mut)]
    pub edition_metadata: UncheckedAccount<'info>,
    
    /// CHECK: Master Edition account (created by Metaplex CPI)
    #[account(mut)]
    pub edition_master_edition: UncheckedAccount<'info>,
    
    /// CHECK: Collection mint for metadata
    pub collection_mint: AccountInfo<'info>,
    
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    /// CHECK: Authority receives payment
    #[account(mut, constraint = authority_account.key() == bonding_curve.authority)]
    pub authority_account: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    /// CHECK: Metaplex Token Metadata Program
    #[account(address = mpl_token_metadata::ID)]
    pub token_metadata_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct GetPrice<'info> {
    #[account(
        seeds = [b"bonding_curve", bonding_curve.collection_mint.as_ref()],
        bump = bonding_curve.bump
    )]
    pub bonding_curve: Account<'info, BondingCurve>,
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
    #[msg("Maximum supply has been reached")]
    MaxSupplyReached,
    #[msg("Unauthorized: Only the authority can perform this action")]
    Unauthorized,
    #[msg("Curve is not empty: cannot close while supply exists")]
    CurveNotEmpty,
    #[msg("Arithmetic overflow in price calculation")]
    ArithmeticOverflow,
}
