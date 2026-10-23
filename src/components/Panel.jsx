import useReveal from '../hooks/reveal'

export default function Panel({ id, kicker, title, tone = 'bg-panel', center = false, children }) {
  const [ref, shown] = useReveal()

  return (
    <section id={id} aria-labelledby={`${id}-title`}
      className={`relative -mt-10 rounded-t-[1.75rem] px-pad py-[clamp(3.5rem,8vw,6.5rem)] md:rounded-t-[2.5rem] ${tone}`}>
      <div ref={ref} data-shown={shown}
        className={`reveal ${center ? 'flex flex-col items-center text-center' : ''}`}>
        {kicker && <p className="mb-3 text-[0.8rem] font-semibold text-brand">{kicker}</p>}
        <h2 id={`${id}-title`} className="max-w-[22ch] text-[clamp(1.7rem,4.2vw,2.8rem)] font-bold uppercase">{title}</h2>
        {children}
      </div>
    </section>
  )
}