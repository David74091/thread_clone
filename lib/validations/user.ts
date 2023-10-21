//與joi類似，zod 是一個幫助確保資料結構正確並提供類型安全的 TypeScript 庫
import * as z from "zod";

export const UserValidation = z.object({
  profile_photo: z.string().url().nonempty(),
  name: z.string().min(3).max(30),
  username: z.string().min(3).max(30),
  bio: z.string().min(3).max(1000),
});
