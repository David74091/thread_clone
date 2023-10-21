"use client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserValidation } from "@/lib/validations/user";
import * as z from "zod";
import Image from "next/image";
import { ChangeEvent, useState } from "react";
import { Textarea } from "../ui/textarea";
import { isBase64Image } from "@/lib/utils";
import { useUploadThing } from "@/lib/uploadthing";
import { updateUser } from "@/lib/actions/user.actions";

import { useRouter, usePathname } from "next/navigation";

interface Props {
  user: {
    id: string;
    objectId: string;
    username: string;
    name: string;
    bio: string;
    image: string;
  };
  btnTitle: string;
}

const AccountPofile = ({ user, btnTitle }: Props) => {
  const [files, setFiles] = useState<File[]>([]);
  const { startUpload } = useUploadThing("media");
  const router = useRouter();
  const pathname = usePathname();

  const form = useForm({
    resolver: zodResolver(UserValidation),
    defaultValues: {
      profile_photo: user?.image || "",
      name: user?.name || "",
      username: user?.username || "",
      bio: user?.bio || "",
    },
  });

  //用於實現文件上傳並處理所選圖像，並將圖像 URL 傳遞給其他部分的應用程式進行進一步處理或顯示
  // 1.防止事件的默認行為，以確保不觸發表單的自動提交。
  // 2.創建一個 FileReader 物件，用於讀取文件內容。
  // 3.從事件對象中獲取選定的文件，並將這些文件轉換為 JavaScript 陣列。
  // 4.檢查文件的類型是否包含 "image"，如果不是圖像文件，則不執行後續操作。
  // 5.使用 FileReader 讀取文件的內容並轉換為 Data URL。
  // 6.在讀取完成後，執行 fileReader.onload 事件處理器中的操作，將讀取到的 Data URL 傳遞給 fieldChange 函數，以供後續處理或顯示。
  const handleImage = (
    e: ChangeEvent<HTMLInputElement>, // 這個函數接受兩個參數。`e` 是事件對象，它表示文件上傳輸入框的變化事件。
    fieldChange: (value: string) => void // `fieldChange` 是一個回調函數，接受一個字串參數並返回空值（void）。
  ) => {
    e.preventDefault(); // 防止事件的默認行為，通常用於阻止表單的自動提交。

    const fileReader = new FileReader(); // 創建一個 FileReader 物件，用於讀取文件內容。

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]; // 從事件對象中獲取選定的文件。

      // 使用 Array.from 將類似陣列的 FileList 物件轉換為真正的 JavaScript 陣列。
      setFiles(Array.from(e.target.files));

      // 檢查文件的類型是否包含 "image"，如果不是圖像文件，則不執行後續操作。
      if (!file.type.includes("image")) return;

      fileReader.onload = async (event) => {
        // 從文件讀取圖像數據的 URL。如果未能讀取 URL，將使用空字串。
        const imageDataUrl = event.target?.result?.toString() || "";

        // 調用 `fieldChange` 函數，將圖像 URL 傳遞給它，這個函數通常用於處理圖像 URL 的後續操作。
        fieldChange(imageDataUrl);
      };

      // 啟動文件讀取操作，讀取文件的內容並觸發 `fileReader.onload` 中的回調函數。
      fileReader.readAsDataURL(file); //這段觸發上面的fileReader.onload = async
    } //轉換為Data URL，包含base64編碼
  };

  const onSubmit = async (values: z.infer<typeof UserValidation>) => {
    const blob = values.profile_photo;

    //原本的圖片可能會以 URL 或其他形式來展示，而不是以 Base64 編碼的形式儲存在表單資料中。只有當使用者更改了圖片時，新的圖片資料才會以 Base64 編碼的形式儲存在表單資料中。
    const hasImageChanged = isBase64Image(blob);

    if (hasImageChanged) {
      const imgRes = await startUpload(files);

      if (imgRes && imgRes[0].fileUrl) {
        values.profile_photo = imgRes[0].fileUrl;
      }
    }

    await updateUser({
      userId: user.id,
      username: values.username,
      name: values.name,
      bio: values.bio,
      image: values.profile_photo,
      path: pathname,
    });

    console.log("三小啦");

    if (pathname === "/profile/edit") {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col justify-start gap-10"
      >
        <FormField
          control={form.control}
          name="profile_photo"
          render={({ field }) => (
            <FormItem className="flex items-center gap-4">
              <FormLabel className="account-form_image-label">
                {field.value ? (
                  <Image
                    src={field.value}
                    alt="profile photo"
                    width={96}
                    height={96}
                    //優先加載
                    priority
                    className="rounded-full object-contain"
                  />
                ) : (
                  <Image
                    src="/assets/profile.svg"
                    alt="profile photo"
                    width={24}
                    height={24}
                    className="rounded-full object-contain"
                  />
                )}
              </FormLabel>
              <FormControl className="flex-1 text-base-semibold text-gray-200">
                <Input
                  type="file"
                  accept="image/*"
                  placeholder="上傳一張圖片"
                  className="account-form_image-input"
                  onChange={(e) => handleImage(e, field.onChange)} //將 e 傳遞給 handleImage，並且在 handleImage 函數中執行 field.onChange 的方式來更新表單
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="flex flex-col w-full gap-3">
              <FormLabel className="text-base-semibold text-light-2">
                名稱
              </FormLabel>
              <FormControl>
                <Input
                  type="text"
                  className="account-form_input no-focus"
                  {...field}
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-3 w-full">
              <FormLabel className="text-base-semibold text-light-2">
                帳號
              </FormLabel>
              <FormControl>
                <Input
                  type="text"
                  className="account-form_input no-focus"
                  {...field}
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-3 w-full">
              <FormLabel className="text-base-semibold text-light-2">
                簡介
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={10}
                  className="account-form_input no-focus"
                  {...field}
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="bg-primary-500" type="submit">
          Submit
        </Button>
      </form>
    </Form>
  );
};

export default AccountPofile;
