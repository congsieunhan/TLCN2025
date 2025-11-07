import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../App.css";
import { Link } from "react-router-dom";
import sl1 from "../assets/1.jpg";
import sl2 from "../assets/2.jpg";
import sl3 from "../assets/3.jpg"; 
import sp1 from "../assets/sp1.jpg";
import sp2 from "../assets/sp2.jpg";
import sp3 from "../assets/sp3.jpg";
import sp4 from "../assets/sp4.jpg";
export default function Home() {
    return (
        <div>
            {/* Carousel */}
            <div id="carouselExampleDark" className="carousel carousel-dark slide" data-bs-ride="carousel">
                {/* indicators */}
                <div className="carousel-indicators">
                    <button type="button" data-bs-target="#carouselExampleDark" data-bs-slide-to="0" className="active" aria-label="Slide 1"></button>
                    <button type="button" data-bs-target="#carouselExampleDark" data-bs-slide-to="1" aria-label="Slide 2"></button>
                    <button type="button" data-bs-target="#carouselExampleDark" data-bs-slide-to="2" aria-label="Slide 3"></button>
                </div>

                {/* slides */}
                <div className="carousel-inner">
                    <div className="carousel-item active" data-bs-interval="3000">
                        <img src={sl1} className="d-block w-100 mx-auto" alt="Slide 1" />
                        <div className="carousel-caption d-none d-md-block">
                            <h5>First slide label</h5>
                            <p>Some representative placeholder content for the first slide.</p>
                        </div>
                    </div>
                    <div className="carousel-item" data-bs-interval="3000">
                        <img src={sl2} className="d-block w-100 mx-auto" alt="Slide 2" />
                        <div className="carousel-caption d-none d-md-block">
                            <h5>Second slide label</h5>
                            <p>Some representative placeholder content for the second slide.</p>
                        </div>
                    </div>
                    <div className="carousel-item" data-bs-interval="3000">
                        <img src={sl3} className="d-block w-100 mx-auto" alt="Slide 3" />
                        <div className="carousel-caption d-none d-md-block">
                            <h5>Third slide label</h5>
                            <p>Some representative placeholder content for the third slide.</p>
                        </div>
                    </div>
                </div>

                {/* controls */}
                <button className="carousel-control-prev" type="button" data-bs-target="#carouselExampleDark" data-bs-slide="prev">
                    <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span className="visually-hidden">Previous</span>
                </button>
                <button className="carousel-control-next" type="button" data-bs-target="#carouselExampleDark" data-bs-slide="next">
                    <span className="carousel-control-next-icon" aria-hidden="true"></span>
                    <span className="visually-hidden">Next</span>
                </button>
            </div>


            {/* Brands */}
            <div className="brand-logos text-center my-5">
                <img alt="Apple" />
                <img alt="Samsung" />
                <img alt="Xiaomi" />
                <img alt="Oppo" />
                <img alt="Vivo" />
            </div>

            {/* Featured Products */}
            <div className="container my-5 featured-products">
                <h2 className="section-title text-center mb-4">SẢN PHẨM NỔI BẬT</h2>
                <div className="row">
                    <div className="col-md-3">
                        <div className="card product-card text-center">
                            <Link to="/detail/1">
                                <img src={sp1} className="card-img-top" alt="Product 1" />
                            </Link>
                            <div className="card-body">
                                <h5 className="card-title">
                                    <Link to="/detail/1" className="text-decoration-none text-dark">Điện thoại A</Link>
                                </h5>
                                <p className="price">
                                    <span className="text-muted text-decoration-line-through">15.000.000₫</span>
                                    <span className="fw-bold text-danger">12.000.000₫</span>
                                </p>
                                <p className="rating mb-3">
                                    <i className="bi bi-star-fill text-warning"></i>
                                    <i className="bi bi-star-fill text-warning"></i>
                                    <i className="bi bi-star-fill text-warning"></i>
                                    <i className="bi bi-star-fill text-warning"></i>
                                    <i className="bi bi-star text-warning"></i>
                                    <span className="ms-2">(4 đánh giá)</span>
                                </p>
                                <div className="d-flex justify-content-center gap-2 mb-3">
                                    <Link to="/detail/1" className="btn btn-dark btn-sm">Mua ngay</Link>
                                    <button className="btn btn-outline-dark btn-sm"><i className="bi bi-cart"></i></button>
                                    <button className="btn btn-outline-dark btn-sm"><i className="bi bi-heart"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* TODO: thêm các sản phẩm khác tương tự */}
                </div>
            </div>
        </div>
    );
}
