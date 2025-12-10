import sql from "mssql";

import dotenv from "dotenv";

dotenv.config();



let pool;



export async function getDB() {

    if (!pool) {

        pool = await sql.connect(process.env.DB_CONN);

        console.log("Connected to Azure SQL Database.");

    }

    return pool;

}

 