"use server";

import { revalidatePath } from "next/cache";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";
import { FilterQuery, SortOrder } from "mongoose";
import Thread from "../models/thread.model";

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

// 1.計算跳過的用戶數：
// 函數計算 skipAmount，這是用於分頁的計算，它確定要跳過多少用戶以獲取指定 pageNumber 的用戶。

// 2.創建正則表達式：
// 函數創建一個正則表達式對象 regex，用於進行模糊搜索。這個正則表達式將根據 searchString 創建，並忽略大小寫。

// 3.構建查詢條件：
// 函數創建一個查詢條件對象 query，以用於 MongoDB 查詢。
// query 要求 id 不等於給定的 userId，這意味著不包括指定用戶自己。

// 4.設置搜索條件：
// 如果 searchString 不為空，則函數設置 $or 條件，以便搜索 username 或 name 字段中包含 searchString 匹配的用戶。

// 5.設置排序選項：
// 函數設置排序選項，根據 createAt 字段以指定的排序方式（sortBy 參數）進行排序。

// 6.執行用戶查詢：
// 函數創建一個用戶查詢對象 usersQuery，並應用先前設定的過濾、排序和分頁選項。
// 它然後使用 .exec() 方法執行查詢，獲得用戶數據。

// 7.獲取總用戶數：
// 函數使用 User.countDocuments(query) 獲取符合查詢條件的總用戶數。

// 8.確定是否有更多用戶：
// 函數檢查是否仍有更多用戶可以加載，並將結果存儲在 isNext 變量中。
// 返回結果：

// 最後，函數返回一個包含用戶數據和 isNext 標誌的對象。
export async function fetchUsers({
  userId,
  searchString = "",
  pageNumber = 1, // 頁碼，默認為1
  pageSize = 20, // 每頁的用戶數，默認為20
  sortBy = "desc", // 用戶排序方式，默認為降序
}: {
  userId: string; // 用戶ID，必填
  searchString?: string; // 用戶搜索字符串，可選，默認為空字符串
  pageNumber?: number; // 頁碼，可選，默認為1
  pageSize?: number; // 每頁的用戶數，可選，默認為20
  sortBy?: SortOrder; // 用戶排序方式，可選，默認為降序
}) {
  try {
    connectToDB(); // 連接到數據庫

    const skipAmount = (pageNumber - 1) * pageSize; // 計算要跳過的用戶數

    const regex = new RegExp(searchString, "i"); // 創建不區分大小寫的正則表達式

    const query: FilterQuery<typeof User> = {
      id: { $ne: userId }, // 創建查詢條件，排除指定userId的用戶
    };

    if (searchString.trim() !== "") {
      // 如果搜索字符串不為空

      query.$or = [
        // 創建 或 條件，用於查詢包含username或name字段中包含搜索字符串的用戶
        { username: { $regex: regex } },
        { name: { $regex: regex } },
      ];
    }

    const sortOptions = { createAt: sortBy }; // 創建排序選項，按createAt字段排序

    // 創建用戶查詢，按照指定條件進行過濾、排序、分頁
    const usersQuery = User.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize);

    const totalUsersCount = await User.countDocuments(query); // 獲取符合查詢條件的總用戶數

    const users = await usersQuery.exec(); // 執行用戶查詢，獲取用戶數據

    const isNext = totalUsersCount > skipAmount + users.length; // 檢查是否還有更多用戶可以加載

    return { users, isNext }; // 返回用戶數據和是否有更多用戶的標誌
  } catch (error: any) {
    // 如果發生錯誤，拋出帶有錯誤消息的異常
    throw new Error(`獲取所有用戶失敗${error.message}`);
  }
}

//查找特定用戶的論壇主題回覆（子主題），並將這些回覆的作者信息填充後返回。
export async function getActivity(userId: string) {
  try {
    connectToDB();

    const userThreads = await Thread.find({ author: userId }); // 查找特定用戶的所有主題（Threads）

    const childThreadIds = userThreads.reduce((acc, userThread) => {
      return acc.concat(userThread.children);
    }, []); // 獲取這些主題的所有子主題的ID，並將它們放入一個數組中

    const replies = await Thread.find({
      _id: { $in: childThreadIds }, // 查找在 `childThreadIds` 數組中的子主題
      author: { $ne: userId }, // 且不包括特定用戶自己發表的子主題
    }).populate({
      path: "author", // 對作者字段進行關聯填充
      model: User, // 使用 User 模型來填充作者信息
      select: "name image _id", // 只選擇作者的名字、圖像和ID字段
    });

    return replies; // 返回填充了作者信息的子主題數據
  } catch (error) {
    console.error("Error fetching replies: ", error); // 如果出現錯誤，記錄錯誤信息
    throw error; // 拋出錯誤以進一步處理
  }
}
