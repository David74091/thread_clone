"use server";

import { FilterQuery, SortOrder } from "mongoose"; // 匯入 mongoose 函式庫中的 FilterQuery 和 SortOrder 類型
import { revalidatePath } from "next/cache"; // 匯入名為 revalidatePath 的函式

import Community from "../models/community.model"; // 匯入 Community 模型
import Thread from "../models/thread.model"; // 匯入 Thread 模型
import User from "../models/user.model"; // 匯入 User 模型

import { connectToDB } from "../mongoose"; // 匯入自定義函式 connectToDB，用來建立資料庫連線

// 根據使用者 ID 擷取使用者資料
export async function fetchUser(userId: string) {
  try {
    connectToDB(); // 建立資料庫連線

    return await User.findOne({ id: userId }).populate({
      path: "communities",
      model: Community,
    });
  } catch (error: any) {
    throw new Error(`無法擷取使用者資料: ${error.message}`);
  }
}

// 定義一個介面 Params，包含更新使用者資料所需的參數
interface Params {
  userId: string;
  username: string;
  name: string;
  bio: string;
  image: string;
  path: string;
}

// 更新使用者資料
export async function updateUser({
  userId,
  bio,
  name,
  path,
  username,
  image,
}: Params): Promise<void> {
  try {
    connectToDB(); // 建立資料庫連線

    await User.findOneAndUpdate(
      { id: userId },
      {
        username: username.toLowerCase(),
        name,
        bio,
        image,
        onboarded: true,
      },
      { upsert: true }
    );

    if (path === "/profile/edit") {
      revalidatePath(path); // 如果路徑為 "/profile/edit"，則重新驗證該路徑
    }
  } catch (error: any) {
    throw new Error(`無法創建/更新使用者: ${error.message}`);
  }
}

// 擷取使用者發表的文章
export async function fetchUserPosts(userId: string) {
  try {
    connectToDB(); // 建立資料庫連線

    // 擷取所有由具有給定 userId 的使用者撰寫的主題文章
    const threads = await User.findOne({ id: userId }).populate({
      path: "threads",
      model: Thread,
      populate: [
        {
          path: "community",
          model: Community,
          select: "name id image _id", // 選擇 "Community" 模型的 "name" 和 "_id" 欄位
        },
        {
          path: "children",
          model: Thread,
          populate: {
            path: "author",
            model: User,
            select: "name image id", // 選擇 "User" 模型的 "name"、"image" 和 "id" 欄位
          },
        },
      ],
    });
    return threads;
  } catch (error) {
    console.error("擷取使用者文章時發生錯誤:", error);
    throw error;
  }
}

// 擷取使用者列表，支援搜尋和分頁
export async function fetchUsers({
  userId,
  searchString = "",
  pageNumber = 1,
  pageSize = 20,
  sortBy = "desc",
}: {
  userId: string;
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: SortOrder;
}) {
  try {
    connectToDB(); // 建立資料庫連線

    // 計算根據頁碼和頁面大小需要跳過的使用者數量
    const skipAmount = (pageNumber - 1) * pageSize;

    // 創建一個不區分大小寫的正則表達式，用於提供的搜尋字串
    const regex = new RegExp(searchString, "i");

    // 創建一個初始查詢物件，用於過濾使用者
    const query: FilterQuery<typeof User> = {
      id: { $ne: userId }, // 排除目前使用者
    };

    // 如果搜尋字串不為空，則添加 $or 運算子以匹配使用者名稱或名稱欄位
    if (searchString.trim() !== "") {
      query.$or = [
        { username: { $regex: regex } },
        { name: { $regex: regex } },
      ];
    }

    // 定義根據建立日期欄位和提供的排序順序進行排序的選項
    const sortOptions = { createdAt: sortBy };

    const usersQuery = User.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize);

    // 計算符合搜尋條件的使用者的總數（不包括分頁）
    const totalUsersCount = await User.countDocuments(query);

    const users = await usersQuery.exec();

    // 檢查是否有更多的使用者在當前頁面之外
    const isNext = totalUsersCount > skipAmount + users.length;

    return { users, isNext };
  } catch (error) {
    console.error("擷取使用者時發生錯誤:", error);
    throw error;
  }
}

// 擷取使用者的活動
export async function getActivity(userId: string) {
  try {
    connectToDB(); // 建立資料庫連線

    // 擷取由使用者建立的所有主題文章
    const userThreads = await Thread.find({ author: userId });

    // 收集每個使用者主題文章的 'children' 欄位中的子主題文章 ID（回覆）
    const childThreadIds = userThreads.reduce((acc, userThread) => {
      return acc.concat(userThread.children);
    }, []);

    // 擷取並返回子主題文章（回覆），排除由相同使用者建立的主題文章
    const replies = await Thread.find({
      _id: { $in: childThreadIds },
      author: { $ne: userId }, // 排除由相同使用者建立的主題文章
    }).populate({
      path: "author",
      model: User,
      select: "name image _id", // 選擇 "User" 模型的 "name"、"image" 和 "_id" 欄位
    });

    return replies;
  } catch (error) {
    console.error("擷取回覆時發生錯誤: ", error);
    throw error;
  }
}
