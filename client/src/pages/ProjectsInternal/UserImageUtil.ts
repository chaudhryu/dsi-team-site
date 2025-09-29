const userImages: Record<string, string> = {
  "96880": "/images/team/trungTu.jpg",
  "87100": "/images/team/usmanChaudhr.jpg",
  "95510": "/images/team/joeHang.jpg",
  "93627": "/images/team/sangjunOh.jpg",
  "93467": "/images/team/sharadaNataraj.jpg",
  "58146": "/images/team/joelJoshy.jpg",
};

export const getUserImage = (badgeNumber: string) => {
  if (badgeNumber) {
    return userImages[badgeNumber];
  } else {
    return undefined;
  }
};
