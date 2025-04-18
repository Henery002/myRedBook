const TAB_LIST = [
  {
    id: "list1",
    title: "推荐",
  },
  {
    id: "list2",
    title: "旅行",
  },
  {
    id: "list3",
    title: "美食",
  },
  {
    id: "list4",
    title: "摄影",
  },
  {
    id: "list5",
    title: "户外",
  },
  {
    id: "list6",
    title: "穿搭",
  },
  {
    id: "list7",
    title: "家居",
  },
  {
    id: "list8",
    title: "职场",
  },
  {
    id: "list9",
    title: "音乐",
  },
];

const data = [
  {
    id: "1",
    title: "旅行项内容",
    desc: "要是可以和你在这种氛围下一起散步就好了",
  },
  {
    id: "2",
    title: "美女壁纸超清全屏",
    desc: "一些内容",
  },
  {
    id: "3",
    title: "摄影项内容",
    desc: "斑斑乐园出现粉色双头斑斑，太空兄弟都懵了",
  },
  {
    id: "4",
    title: "户外项内容",
    desc: "一些内容",
  },
  {
    id: "5",
    title: "穿搭项内容",
    desc: "一些内容",
  },
  {
    id: "6",
    title: "家居项内容",
    desc: "一些内容",
  },
  {
    id: "7",
    title: "职场项内容",
    desc: "一些内容",
  },
  {
    id: "8",
    title: "音乐项内容",
    desc: "一些内容",
  },
  {
    id: "9",
    title: "音乐项内容",
    desc: "一些内容",
  },
  {
    id: "10",
    title: "音乐项内容",
    desc: "一些内容",
  },
  {
    id: "11",
    title: "音乐项内容",
    desc: "一些内容",
  },
  {
    id: "12",
    title: "音乐项内容",
    desc: "一些内容",
  },
  {
    id: "13",
    title: "音乐项内容",
    desc: "一些内容",
  },
  {
    id: "14",
    title: "音乐项内容",
    desc: "一些内容",
  },
];

const avatarUrl =
  "https://636c-cloud1-2gm986mx5cd74abe-1348954015.tcb.qcloud.la/notes/1744904918634-sby7rlhlea.jpeg?sign=c7064601040bfcf37992dbeef2cf0bd2&t=1744904964";

const commentData = [
  {
    _id: "9f86c6566800a3f5014dbc813262bf4",
    _openid: "oNbUB7Gb85EJLRK27-RMwVLomcjk",
    noteId: "e23fc3b2680051ec014552cc3bf7c1df",
    content: "为什么我早上开车还是很堵😫",
    images: [],
    avatar: avatarUrl, // "https://example.com/avatar1.jpg",
    nickname: "用户A",
    address: "广州市",
    likes: 3,
    createdAt: "2025-04-17T06:47:17.000Z",
    updatedAt: "2025-04-17T06:47:17.000Z",
    replies: [
      {
        _id: "reply_001",
        _openid: "another_openid_001",
        parentId: "9f86c6566800a3f5014dbc813262bf4",
        content: "早高峰都这样",
        images: [],
        avatar: avatarUrl, // "https://example.com/avatar2.jpg",
        nickname: "用户B",
        address: "深圳市",
        likes: 1,
        createdAt: "2025-04-17T07:00:00.000Z",
        updatedAt: "2025-04-17T07:00:00.000Z",
      },
      {
        _id: "reply_002",
        _openid: "another_openid_002",
        parentId: "9f86c6566800a3f5014dbc813262bf4",
        content: "@用户B 是的，建议早点出门",
        images: [],
        avatar: avatarUrl, // "https://example.com/avatar3.jpg",
        nickname: "用户C",
        address: "广州市",
        likes: 0,
        createdAt: "2025-04-17T07:15:00.000Z",
        updatedAt: "2025-04-17T07:15:00.000Z",
        replyTo: {
          _id: "another_openid_001",
          nickname: "用户B",
        },
      },
    ],
  },
];

export { TAB_LIST, data, commentData };
