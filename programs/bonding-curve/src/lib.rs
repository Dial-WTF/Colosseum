use anchor_lang::prelude::*;

declare_id!("BC11111111111111111111111111111111111111111");

#[program]
pub mod bonding_curve {
    use super::*;

    /// Initialize a new bonding curve for an NFT collection
    pub fn initialize_curve(
        ctx: Context<InitializeCurve>,
        curve_type: u8,
        base_price: u64,
        price_increment: u64,
        max_supply: u32,
    ) -> Result<()> {
        let curve = &mut ctx.accounts.bonding_curve;
        
        curve.authority = ctx.accounts.authority.key();
        curve.collection_mint = ctx.accounts.collection_mint.key();
        curve.curve_type = curve_type;
        curve.base_price = base_price;
        curve.price_increment = price_increment;
        curve.max_supply = max_supply;
        curve.current_supply = 0;
        curve.total_volume = 0;
        curve.bump = ctx.bumps.bonding_curve;

        msg!("Bonding curve initialized");
        
        Ok(())
    }

    /// Get current price for next edition
    pub fn get_price(
        ctx: Context<GetPrice>,
    ) -> Result<()> {
        let curve = &ctx.accounts.bonding_curve;
        
        // Simple linear calculation for now
        let price = curve.base_price + ((curve.current_supply as u64) * curve.price_increment);
        
        msg!("Current price: {} lamports", price);
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeCurve<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 120,
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
pub struct GetPrice<'info> {
    #[account(
        seeds = [b"bonding_curve", bonding_curve.collection_mint.as_ref()],
        bump = bonding_curve.bump
    )]
    pub bonding_curve: Account<'info, BondingCurve>,
}

#[account]
pub struct BondingCurve {
    pub authority: Pubkey,          // 32
    pub collection_mint: Pubkey,    // 32
    pub curve_type: u8,             // 1
    pub base_price: u64,            // 8
    pub price_increment: u64,       // 8
    pub max_supply: u32,            // 4
    pub current_supply: u32,        // 4
    pub total_volume: u64,          // 8
    pub bump: u8,                   // 1
}

