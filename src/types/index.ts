export interface Note {
  _id: string;
  title: string;
  content: string;
  images: string[];
  author: {
    _id: string;
    avatarUrl: string;
    nickName: string;
  };
  location?: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  likes: number;
  comments: number;
  createdAt: string;
  updatedAt: string;
}
