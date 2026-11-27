export default function ErrorState({ message }) {
  return (
    <div className="page">
      <div className="in">
        <p className="empty-note">打不开了：{message}</p>
      </div>
    </div>
  );
}
