export default function CardBlock({ title, icon, children, onClick, style }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "32px 22px 26px 22px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginBottom: "0px",
        background: "linear-gradient(134deg,#FFF 70%,#F2F7FC 100%)",
        borderRadius: 22,
        boxShadow: "0 6px 26px rgba(165,192,227,0.14)",
        minHeight: 168,
        maxWidth: 300,
        transition: "box-shadow .16s, transform .14s",
        userSelect: "none",
        cursor: "pointer",
        ...style
      }}
      onMouseOver={e => {
        e.currentTarget.style.boxShadow = "0 10px 48px rgba(120,120,172,0.19)";
        e.currentTarget.style.transform = "translateY(-1.5px) scale(1.035)";
      }}
      onMouseOut={e => {
        e.currentTarget.style.boxShadow = "0 6px 26px rgba(165,192,227,0.14)";
        e.currentTarget.style.transform = "none";
      }}
    >
      <div style={{
        fontSize: "2.8em",
        marginBottom: "13px",
        textShadow: "0 2px 12px #e8edfa"
      }}>
        {icon}
      </div>
      <div style={{
        fontWeight: 700,
        color: "#232C49",
        fontSize: "1.19em",
        marginBottom: "7px",
        textAlign: "center",
        letterSpacing: "0.02em"
      }}>
        {title}
      </div>
      <div style={{
        color: "#52618b",
        textAlign: "center",
        fontSize: "1em",
        fontWeight: 400,
        opacity: .82,
        marginBottom: "0px"
      }}>
        {children}
      </div>
    </div>
  );
}
