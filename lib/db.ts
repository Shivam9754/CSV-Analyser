// lib/db.ts

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  country: string;
  phone: string;
}

function getUsersFilePath() {
  const path = require("path");
  return path.join(process.cwd(), "users.json");
}

export async function readUsers(): Promise<User[]> {
  if (typeof window !== "undefined" || process.env.NEXT_RUNTIME === "edge") {
    return [];
  }
  try {
    const fs = require("fs").promises;
    const filePath = getUsersFilePath();
    try {
      const data = await fs.readFile(filePath, "utf-8");
      return JSON.parse(data);
    } catch (err: any) {
      if (err.code === "ENOENT") {
        // Return empty array if file does not exist
        return [];
      }
      throw err;
    }
  } catch (error) {
    console.error("Error reading users.json:", error);
    return [];
  }
}

export async function writeUsers(users: User[]): Promise<boolean> {
  if (typeof window !== "undefined" || process.env.NEXT_RUNTIME === "edge") {
    return false;
  }
  try {
    const fs = require("fs").promises;
    const filePath = getUsersFilePath();
    await fs.writeFile(filePath, JSON.stringify(users, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error writing users.json:", error);
    return false;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await readUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function createUser(user: Omit<User, "id">): Promise<User | null> {
  const users = await readUsers();
  
  // Check if user already exists
  if (users.some((u) => u.email.toLowerCase() === user.email.toLowerCase())) {
    return null;
  }
  
  const newUser: User = {
    ...user,
    id: Math.random().toString(36).substring(2, 15),
  };
  
  users.push(newUser);
  const success = await writeUsers(users);
  return success ? newUser : null;
}
