export const sidebarLinks = [
  {
    imgURL: "/assets/home.svg",
    route: "/",
    label: "首頁",
  },
  {
    imgURL: "/assets/search.svg",
    route: "/search",
    label: "查詢用戶",
  },
  {
    imgURL: "/assets/heart.svg",
    route: "/activity",
    label: "活動紀錄",
  },
  {
    imgURL: "/assets/create.svg",
    route: "/create-thread",
    label: "創建主題",
  },
  {
    imgURL: "/assets/community.svg",
    route: "/communities",
    label: "所有社區",
  },
  {
    imgURL: "/assets/user.svg",
    route: "/profile",
    label: "個人資料",
  },
];

export const profileTabs = [
  { value: "threads", label: "主題", icon: "/assets/reply.svg" },
  { value: "replies", label: "留言", icon: "/assets/members.svg" },
  { value: "tagged", label: "標籤", icon: "/assets/tag.svg" },
];

export const communityTabs = [
  { value: "threads", label: "主題", icon: "/assets/reply.svg" },
  { value: "members", label: "成員", icon: "/assets/members.svg" },
  { value: "requests", label: "請求", icon: "/assets/request.svg" },
];
