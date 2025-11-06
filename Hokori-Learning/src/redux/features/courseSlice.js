import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../configs/axios";

// =============================================================
// ========== MOCK DATA (dùng cho demo, xóa khi có API) =========
// =============================================================
// ========== MOCK DATA (⚠️ chỉ dùng cho demo, xóa khi có API thật) ==========
const MOCK_COURSES = [
  {
    id: 1,
    title: "JLPT N5 – Nền tảng tiếng Nhật",
    teacher: "Sensei Tanaka",
    teacherAvatar:
      "https://thumbs.dreamstime.com/b/teacher-icon-vector-male-person-profile-avatar-book-teaching-school-college-university-education-glyph-113755262.jpg",
    level: "N5",
    rating: 4.8,
    ratingCount: 120,
    students: 1200,
    price: 499000,
    oldPrice: 699000,
    tags: ["Kèm AI", "Bán chạy"],
    description:
      "Khóa học nền tảng giúp bạn bắt đầu hành trình học tiếng Nhật hiệu quả, được thiết kế cho người mới bắt đầu.",
    shortDesc:
      "Khóa học cơ bản giúp nắm vững Hiragana, Katakana và ngữ pháp nền tảng.",
    videoUrl: "https://www.youtube.com/embed/D523ubwNZKk?si=p5hji6iGm2wLgZ2P",

    overview: {
      intro: [
        "Khóa học JLPT N5 được thiết kế dành cho người mới bắt đầu học tiếng Nhật.",
        "Giúp học viên xây dựng nền tảng ngữ pháp và từ vựng vững chắc, làm bước đệm cho các cấp độ cao hơn.",
      ],
      features: [
        {
          icon: "fa-headphones",
          title: "Luyện nghe",
          desc: "Cải thiện khả năng nghe hiểu qua hội thoại thực tế.",
        },
        {
          icon: "fa-comments",
          title: "Kaiwa thực tế",
          desc: "Luyện nói và phản xạ nhanh với tình huống đời thực.",
        },
        {
          icon: "fa-brain",
          title: "AI Vocabulary",
          desc: "Được AI gợi ý từ vựng phù hợp với tiến độ học tập.",
        },
      ],
    },

    chapters: [
      { title: "Giới thiệu bảng chữ Hiragana", lessons: 5, time: "45 phút" },
      { title: "Katakana cơ bản", lessons: 4, time: "35 phút" },
      { title: "Ngữ pháp sơ cấp", lessons: 6, time: "50 phút" },
    ],

    info: {
      totalVideos: 23,
      duration: "3.5 giờ",
      level: "Sơ cấp",
      certificate: true,
    },

    instructor: {
      name: "Sensei Tanaka",
      bio: "Giảng viên tiếng Nhật với hơn 10 năm kinh nghiệm giảng dạy, từng làm việc tại nhiều trung tâm nổi tiếng.",
      avatar:
        "https://thumbs.dreamstime.com/b/teacher-icon-vector-male-person-profile-avatar-book-teaching-school-college-university-education-glyph-113755262.jpg",
      stats: { students: 15000, rating: 4.9, courses: 25 },
    },

    reviews: [
      {
        user: {
          name: "Nguyễn Minh Anh",
          avatar: "https://cdn-icons-png.flaticon.com/512/4140/4140037.png",
        },
        comment: "Khóa học rất dễ hiểu, giảng viên nhiệt tình!",
        timeAgo: "3 ngày trước",
      },
      {
        user: {
          name: "Phạm Quốc Huy",
          avatar: "https://cdn-icons-png.flaticon.com/512/4140/4140048.png",
        },
        comment: "Bài giảng rõ ràng, phần luyện Kaiwa rất thực tế.",
        timeAgo: "1 tuần trước",
      },
    ],

    relatedCourses: [
      {
        title: "JLPT N4 – Trung cấp",
        teacher: "Sensei Yamada",
        price: 699000,
        rating: 4.7,
        thumbnail:
          "https://img.freepik.com/free-photo/young-student-woman-smiling_23-2148181335.jpg",
      },
      {
        title: "JLPT N3 – Nâng cao",
        teacher: "Sensei Suzuki",
        price: 899000,
        rating: 4.9,
        thumbnail:
          "https://img.freepik.com/free-photo/teacher-woman-standing-classroom_23-2148173642.jpg",
      },
    ],
  },

  {
    id: 2,
    title: "JLPT N4 – Trung cấp tiếng Nhật",
    teacher: "Sensei Yamada",
    teacherAvatar:
      "https://img.freepik.com/free-photo/portrait-young-japanese-teacher_23-2149102139.jpg",
    level: "N4",
    rating: 4.7,
    ratingCount: 90,
    students: 890,
    price: 699000,
    oldPrice: 899000,
    tags: ["Mới", "Phổ biến"],
    description:
      "Khóa học N4 giúp bạn củng cố ngữ pháp, từ vựng và kỹ năng đọc hiểu tiếng Nhật.",
    shortDesc:
      "Tiếp tục củng cố nền tảng JLPT N5 để tiến tới trình độ trung cấp.",
    videoUrl: "https://www.youtube.com/embed/gxr9wbEU8Go?si=KS657-MBfa8VTV6o",

    overview: {
      intro: [
        "Khóa học JLPT N4 mở rộng kiến thức từ cấp độ N5, giúp học viên giao tiếp thành thạo hơn.",
        "Phát triển khả năng nghe, đọc và phản xạ qua các chủ đề đời sống hàng ngày.",
      ],
      features: [
        {
          icon: "fa-book",
          title: "Ngữ pháp nâng cao",
          desc: "Hiểu sâu hơn về cấu trúc câu và cách dùng tự nhiên.",
        },
        {
          icon: "fa-microphone",
          title: "Luyện phát âm",
          desc: "Phát âm chuẩn Nhật qua bài luyện AI hướng dẫn.",
        },
        {
          icon: "fa-comments",
          title: "Kaiwa thực hành",
          desc: "Luyện phản xạ hội thoại qua tình huống thực tế.",
        },
      ],
    },

    chapters: [
      { title: "Ôn tập ngữ pháp JLPT N5", lessons: 4, time: "40 phút" },
      { title: "Từ vựng giao tiếp cơ bản", lessons: 6, time: "55 phút" },
      { title: "Luyện đọc hiểu ngắn", lessons: 5, time: "50 phút" },
    ],

    info: {
      totalVideos: 28,
      duration: "4.5 giờ",
      level: "Trung cấp",
      certificate: true,
    },

    instructor: {
      name: "Sensei Yamada",
      bio: "Giảng viên JLPT N3–N5 với hơn 8 năm kinh nghiệm giảng dạy tại các trung tâm Nhật ngữ.",
      avatar:
        "https://img.freepik.com/free-photo/handsome-young-teacher-suit_23-2149171173.jpg",
      stats: { students: 10000, rating: 4.8, courses: 18 },
    },

    reviews: [
      {
        user: {
          name: "Trần Ngọc Hân",
          avatar: "https://cdn-icons-png.flaticon.com/512/4140/4140046.png",
        },
        comment: "Bài học rất dễ hiểu, tài liệu rõ ràng.",
        timeAgo: "5 ngày trước",
      },
    ],

    relatedCourses: [
      {
        title: "JLPT N5 – Nền tảng tiếng Nhật",
        teacher: "Sensei Tanaka",
        price: 499000,
        rating: 4.8,
        thumbnail:
          "https://img.freepik.com/free-photo/smiling-japanese-student-holding-book_23-2149102140.jpg",
      },
    ],
  },
];

// =============================================================
// ========== ASYNC ACTIONS (mock hiện tại, sau này call API) ====
// =============================================================
export const fetchCourses = createAsyncThunk("courses/fetchAll", async () => {
  // const response = await api.get("/courses");
  // return response.data;
  return MOCK_COURSES; // ⚠️ mock tạm thời
});

export const fetchCourseById = createAsyncThunk(
  "courses/fetchById",
  async (id) => {
    // const response = await api.get(`/courses/${id}`);
    // return response.data;
    const found = MOCK_COURSES.find((c) => c.id === Number(id));
    return found || null;
  }
);

// =============================================================
// ========== SLICE SETUP ======================================
// =============================================================
const courseSlice = createSlice({
  name: "courses",
  initialState: {
    list: [],
    current: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrentCourse: (state) => {
      state.current = null;
    },
    //  mapping dữ liệu từ CourseCard sang CourseDetail (demo)
    setCurrentCourse: (state, action) => {
      state.current = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchCourseById.fulfilled, (state, action) => {
        state.current = action.payload;
      });
  },
});

// =============================================================
// ========== EXPORT ============================================
// =============================================================
export const { clearCurrentCourse, setCurrentCourse } = courseSlice.actions;
export default courseSlice.reducer;
