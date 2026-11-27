export default function ErrorState({ message }) {
  return (
    <section className="card">
      <p className="empty-note">打不开了：{message}</p>
    </section>
  );
}
