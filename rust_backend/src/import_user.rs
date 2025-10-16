use color_eyre::eyre::Result;
use sqlx::SqlitePool;

use crate::cli::ImportUserArgs;
use crate::database;

pub async fn import_user(pool: &SqlitePool, args: &ImportUserArgs) -> Result<()> {
    database::add_user(
        pool,
        &args.token,
        &args.name,
        &args.surname,
        false, // sso_user is false for imported users
        &args.role,
    )
    .await?;

    println!("User '{}' imported successfully", args.token);
    Ok(())
}
