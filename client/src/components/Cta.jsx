// src/components/Cta.jsx
import Panel from './Panel'

export default function Cta() {
  return (
    <Panel id="join" tone="bg-cta" center title="Ready to grow?">
      <p className="mb-8 mt-5 max-w-[62ch] text-soft">
        Take the first step toward a stronger, healthier you by claiming your free one-week membership at FFL. Experience our state-of-the-art facilities, join our energizing classes, and see why FFL is the perfect place to reach your fitness goals.
      </p>
      <a className="btn" href="#contact">Claim your free week &rarr;</a>
    </Panel>
  )
}