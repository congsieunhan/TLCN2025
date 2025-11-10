import Header from "./layouts/Header.js";
import Footer from "./layouts/Footer.js";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.js";
import Shop from "./pages/Shop.js";
import Detail from "./pages/Detail.js";
import Login from "./pages/Login.js";   // ⬅️ Thêm dòng này
import Register from "./pages/Register.js";
import ForgotPassword from "./pages/ForgotPassword.js";
import Cart from "./pages/Cart.js";
import CheckoutPage from "./pages/CheckoutPage.js";
import OrdersPage from "./pages/OrdersPage";
function App() {
  return (
    <div>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/detail/:id" element={<Detail />} />
        <Route path="/login" element={<Login />} /> {/* ⬅️ Thêm route */}
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrdersPage />} />
      </Routes>

      <div style={{ textAlign: "center", padding: "20px", marginTop: "120px" }}>
        <h1>Xin chào 👋</h1>
        <p>Đây là giao diện React đầu tiên của mình</p>
        <button onClick={() => alert("Bạn vừa bấm nút!")}>Bấm vào tôi</button>
      </div>

      <Footer />
    </div>
  );
}

export default App;
