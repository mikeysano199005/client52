'use client'
import { useEffect, useRef, useState } from 'react'

const NAMES = [
  'Rahul','Priya','Arjun','Sneha','Amit','Pooja','Vikram','Anjali','Rohit','Neha',
  'Suresh','Kavya','Manish','Divya','Rajesh','Meera','Aakash','Sonia','Deepak','Ritu',
  'Kiran','Ananya','Vishal','Shruti','Nikhil','Pallavi','Sanjay','Preeti','Arun','Nisha',
  'Gaurav','Swati','Manoj','Rekha','Vivek','Sunita','Ashish','Madhuri','Harish','Geeta',
  'Praveen','Seema','Sunil','Lata','Ramesh','Usha','Dinesh','Asha','Vinod','Poonam',
  'Sachin','Anita','Naresh','Shweta','Hemant','Vandana','Ajay','Sarita','Rakesh','Manju',
  'Shyam','Radha','Mohan','Savita','Girish','Nandini','Pramod','Archana','Vijay','Smita',
  'Lalit','Mamta','Rajeev','Alka','Sudhir','Sangeeta','Devesh','Jyoti','Pankaj','Komal',
  'Nitin','Renu','Bharat','Sudha','Kapil','Chhaya','Satish','Bharti','Anil','Pushpa',
  'Tarun','Saroj','Lokesh','Urmila','Yogesh','Savitri','Mukesh','Kamla','Kamlesh','Sheela',
]
const CITIES = [
  'Delhi','Mumbai','Bangalore','Chennai','Hyderabad','Pune','Kolkata','Ahmedabad',
  'Jaipur','Lucknow','Surat','Bhopal','Indore','Nagpur','Patna','Vadodara',
  'Ludhiana','Agra','Nashik','Faridabad','Meerut','Rajkot','Varanasi','Amritsar',
]
const PLANS = [
  'Netflix','Amazon Prime','Hotstar','Jio Hotstar','Spotify','YouTube Premium',
  'Zee5','SonyLIV','JioCinema','Apple TV+',
]
const VARIANTS = ['1 Month','3 Months','6 Months','12 Months']

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 10) return 'just now'
  if (diff < 60) return `${diff} sec ago`
  const mins = Math.floor(diff / 60)
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  return hrs < 24 ? `${hrs} hr ago` : `${Math.floor(hrs / 24)}d ago`
}

interface Entry { name: string; city: string; plan: string; variant: string; time: string }
interface RealOrder { plan_name: string; plan_variant: { label?: string } | null; created_at: string }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function ActivityTicker() {
  const [entries, setEntries] = useState<Entry[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const posRef = useRef(0)
  const rafRef = useRef<number>(0)
  const pausedRef = useRef(false)

  useEffect(() => {
    // Build fake entries
    const fake: Entry[] = Array.from({ length: 30 }, () => {
      const minsAgo = Math.floor(Math.random() * 120)
      const secsAgo = Math.floor(Math.random() * 59)
      const time = minsAgo === 0
        ? (secsAgo < 5 ? 'just now' : `${secsAgo} sec ago`)
        : `${minsAgo} min ago`
      return { name: rand(NAMES), city: rand(CITIES), plan: rand(PLANS), variant: rand(VARIANTS), time }
    })

    fetch('/api/activity')
      .then(r => r.json())
      .then((real: RealOrder[]) => {
        const realEntries: Entry[] = real.map(o => ({
          name: rand(NAMES),
          city: rand(CITIES),
          plan: o.plan_name,
          variant: (o.plan_variant as { label?: string })?.label || rand(VARIANTS),
          time: timeAgo(new Date(o.created_at)),
        }))
        setEntries(shuffle([...fake, ...realEntries]).slice(0, 40))
      })
      .catch(() => setEntries(shuffle(fake)))
  }, [])

  // JS scroll — no CSS animation
  useEffect(() => {
    if (entries.length === 0) return
    const el = scrollRef.current
    if (!el) return

    const SPEED = 0.5 // px per frame

    function step() {
      if (!el || pausedRef.current) { rafRef.current = requestAnimationFrame(step); return }
      posRef.current += SPEED
      // Reset when we've scrolled half (since content is doubled)
      if (posRef.current >= el.scrollWidth / 2) posRef.current = 0
      el.scrollLeft = posRef.current
      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [entries])

  if (entries.length === 0) return null

  const doubled = [...entries, ...entries]

  return (
    <div className="w-full bg-zinc-950 border-b border-white/5 py-2 select-none">
      <div
        ref={scrollRef}
        className="overflow-hidden whitespace-nowrap"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onMouseEnter={() => { pausedRef.current = true }}
        onMouseLeave={() => { pausedRef.current = false }}
      >
        <div className="inline-flex items-center">
          {doubled.map((e, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-4 text-[11px] text-zinc-400 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
              <span className="text-white font-medium">{e.name}</span>
              <span>from</span>
              <span className="text-purple-400">{e.city}</span>
              <span>bought</span>
              <span className="text-white">{e.plan}</span>
              <span className="text-zinc-500">{e.variant}</span>
              <span className="text-zinc-700 mx-1">·</span>
              <span className="text-zinc-600">{e.time}</span>
              <span className="text-zinc-800 ml-3">|</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
