import dotenv from 'dotenv';

dotenv.config();

export const CLIENT_ID = process.env.CLIENT_ID;
export const CLIENT_SECRET = process.env.CLIENT_SECRET;
export const USER_LOGIN = process.env.USER_LOGIN;

export const TOKEN_URL = "https://api.intra.42.fr/oauth/token";
export const API_URL = "https://api.intra.42.fr/v2";

