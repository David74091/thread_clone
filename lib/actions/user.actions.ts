"use server";

import { revalidatePath } from "next/cache";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";

interface Params {
  userId: string;
  username: string;
  name: string;
  bio: string;
  image: string;
  path: string;
}

export async function updateUser({
  userId,
  username,
  name,
  bio,
  image,
  path,
}: Params): Promise<void> {
  connectToDB();

  try {
    await User.findOneAndUpdate(
      { id: userId },
      {
        username: username.toLowerCase() /*轉換成小寫*/,
        name,
        bio,
        image,
        onboarded: true,
      },
      { upsert: true /*現有資料沒有匹配時插入資料*/ }
    );

    if (path === "/profile/edit") {
      revalidatePath(path); //讓頁面重新刷新
    }
    console.log("創建成功");
  } catch (error: any) {
    throw new Error(`創建/更新用戶資料失敗:${error.message}`);
  }
}

export async function fetchUser(userId: string) {
  try {
    connectToDB();
    const user = await User.findOne({ id: userId });
    console.log("幹你娘", user);
    return user;
    // .populate({ path: "communities",model:Community });
  } catch (error: any) {
    throw new Error(`獲取用戶失敗:${error.message}`);
  }
}
