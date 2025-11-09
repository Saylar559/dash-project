import React from "react";

interface Props {
  dashboardTitle: string;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DashboardPublishModal: React.FC<Props> = ({
  dashboardTitle,
  open,
  onClose,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-publish">
        <h2>Публикация дашборда</h2>
        <div>
          Дашборд{" "}
          <b>
            {typeof dashboardTitle === "string"
              ? dashboardTitle
              : ""}
          </b>{" "}
          будет доступен <b>всем пользователям с ролью USER</b>.
        </div>
        <div style={{ color: "#6589b2", margin: "14px 0 0 0", fontSize: 15 }}>
          После публикации, любой пользователь этой роли увидит дашборд у себя в личном кабинете/отчётах.
        </div>
        <div className="modal-actions" style={{ marginTop: 24 }}>
          <button onClick={onClose}>Отмена</button>
          <button onClick={onConfirm} style={{marginLeft: 15}}>Опубликовать</button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPublishModal;
