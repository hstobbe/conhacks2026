export default function EmptyState({ title, body, action }) {
  return (
    <div className="panel rounded-lg px-6 py-10 text-center">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
