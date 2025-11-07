import React from "react";

function Footer() {
  return (
    <footer style={{ 
      backgroundColor: "#222", 
      color: "white", 
      padding: "20px", 
      textAlign: "center",
      marginTop: "30px"
    }}>
      <p>© 2025 My Website. All rights reserved.</p>
      <p>
        <a href="https://facebook.com" target="_blank" rel="noreferrer" style={{color: "#0d6efd", margin: "0 10px"}}>
          <i className="bi bi-facebook"></i>
        </a>
        <a href="https://twitter.com" target="_blank" rel="noreferrer" style={{color: "#0d6efd", margin: "0 10px"}}>
          <i className="bi bi-twitter"></i>
        </a>
        <a href="https://github.com" target="_blank" rel="noreferrer" style={{color: "#0d6efd", margin: "0 10px"}}>
          <i className="bi bi-github"></i>
        </a>
      </p>
    </footer>
  );
}

export default Footer;
