require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cookieParser = require("cookie-parser");
const path = require("path");
const bcrypt = require("bcrypt"); // 비밀번호 암호화를 위한 bcrypt
const User = require("./models/User"); // 사용자 모델
const app = express();
const port = process.env.PORT || 3000; // 환경 변수에 PORT가 없으면 3000번 사용
const connectDb = require("./config/db");

// DB 연결
connectDb();

// 세션 및 쿠키 설정
app.use(cookieParser());
app.use(
  session({
    secret: "your_secret_key", // 세션 암호화를 위한 비밀 키
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI, // 환경 변수 사용
    }),
  })
);

// 요청 본문(body)을 JSON 및 URL 인코딩된 형식으로 파싱하기 위한 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공 설정
app.use(express.static(path.join("public"))); // 'public' 폴더 내의 정적 파일 제공

// 메인 페이지로 main.html 파일 제공
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "main.html"));
});

// 로그인 여부를 클라이언트에 전달하는 API
app.get("/is-logged-in", (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true }); // 로그인된 경우 true 반환
  } else {
    res.json({ loggedIn: false }); // 로그인되지 않은 경우 false 반환
  }
});

// 사용자 등록 라우트 추가
app.use(require("./routes/register")); // register 라우트 사용

// 각 페이지에 대한 라우트 설정
app.get("/first.html", (req, res) => {
  res.sendFile(path.join(__dirname, "first.html")); // first.html 파일 응답
});

app.get("/second.html", (req, res) => {
  res.sendFile(path.join(__dirname, "second.html"));
});

app.get("/third.html", (req, res) => {
  res.sendFile(path.join(__dirname, "third.html"));
});

app.get("/fourth.html", (req, res) => {
  res.sendFile(path.join(__dirname, "fourth.html"));
});

app.get("/register.html", (req, res) => {
  res.sendFile(path.join(__dirname, "register.html"));
});

// 로그인 페이지로 login.html 파일 제공
app.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html")); // login.html 파일을 응답
});

// 로그인 페이지를 렌더링하는 GET 라우트 추가
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html")); // login.html 파일을 응답
});

// 로그인 처리 라우트
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (user && (await bcrypt.compare(password, user.password))) {
      req.session.user = { id: user._id, username: user.username }; // 세션에 사용자 정보 저장
      res.redirect("/"); // 로그인 성공 후 메인 페이지로 리다이렉트
    } else {
      res.redirect("/login?error=invalid_credentials"); // 로그인 실패 시 다시 로그인 페이지로
    }
  } catch (err) {
    console.error(err);
    res.redirect("/login?error=server_error");
  }
});

// 로그아웃 라우트
app.get("/logout", (req, res) => {
  res.clearCookie("user_sid"); // 쿠키 삭제
  req.session.destroy((err) => {
    // 세션 파괴
    return res.redirect("/"); // 로그아웃 후 메인 페이지로 리다이렉트
  });
});

// 서버 시작
app.listen(port, () => {
  console.log(`${port}에서 서버 실행 중...`);
});
