const userImages: Record<string, string> = {
  "58146":
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  "96880": "/images/team/trungTu.jpg",
  "87100": "/images/team/usmanChaudhr.jpg",
  "95510": "/images/team/joeHang.jpg",
  "93627": "/images/team/sangjunOh.jpg",
  "93467": "/images/team/sharadaNataraj.jpg",
};

export const getUserImage = (badgeNumber: string) => {
  if (badgeNumber) {
    return userImages[badgeNumber];
  } else {
    return undefined;
  }
};
