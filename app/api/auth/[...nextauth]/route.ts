// app/api/auth/[...nextauth]/route.ts

import { handlers } from "@/lib/auth" // Imports directly from your /lib/auth.ts file
export const { GET, POST } = handlers