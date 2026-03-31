use std::path::Path;

use color_eyre::eyre::{Result, eyre};
use csv::ReaderBuilder;
use serde::Deserialize;
use sqlx::SqlitePool;

use crate::cli::ImportUserArgs;
use crate::database;
use crate::models::Role;

#[derive(Debug, Deserialize)]
struct CsvUserRecord {
    token: String,
    name: String,
    surname: String,
    role: Option<Role>,
}

struct UserToImport {
    token: String,
    name: String,
    surname: String,
    role: Role,
}

fn validate_field(value: &str, field_name: &str) -> Result<String> {
    let value = value.trim();
    if value.is_empty() {
        return Err(eyre!("User {} cannot be empty", field_name));
    }
    Ok(value.to_owned())
}

fn single_user_from_args(args: &ImportUserArgs) -> Result<UserToImport> {
    Ok(UserToImport {
        token: validate_field(args.token.as_deref().unwrap(), "token")?,
        name: validate_field(args.name.as_deref().unwrap(), "name")?,
        surname: validate_field(args.surname.as_deref().unwrap(), "surname")?,
        role: args.role.clone(),
    })
}

fn users_from_csv(path: &Path, default_role: &Role) -> Result<Vec<UserToImport>> {
    let mut reader = ReaderBuilder::new().trim(csv::Trim::All).from_path(path)?;
    let mut users = Vec::new();

    for row in reader.deserialize() {
        let row: CsvUserRecord = row?;
        users.push(UserToImport {
            token: validate_field(&row.token, "token")?,
            name: validate_field(&row.name, "name")?,
            surname: validate_field(&row.surname, "surname")?,
            role: row.role.unwrap_or(default_role.clone()),
        });
    }

    if users.is_empty() {
        return Err(eyre!("No users found in '{}'", path.display()));
    }

    Ok(users)
}

pub async fn import_user(pool: &SqlitePool, args: &ImportUserArgs) -> Result<()> {
    let users = match &args.csv {
        Some(path) => users_from_csv(path, &args.role)?,
        None => vec![single_user_from_args(args)?],
    };

    let mut tx = pool.begin().await?;
    for user in &users {
        database::add_user(
            &mut *tx,
            &user.token,
            &user.name,
            &user.surname,
            false, // sso_user is false for imported users
            &user.role,
        )
        .await?;
    }
    tx.commit().await?;

    if let Some(path) = &args.csv {
        println!(
            "{} users imported successfully from '{}'",
            users.len(),
            path.display()
        );
    } else {
        println!("User '{}' imported successfully", users[0].token);
    }

    Ok(())
}
