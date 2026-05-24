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
  'Zee5','SonyLIV','JioCinema','MX Player','Apple TV+','Crunchyroll',
]

const VARIANTS = ['1 Month','3 Months','6 Months','12 Months','1 Year']

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 10) return 'just now'
  if (diff < 60) return `${diff} sec ago`
  const mins = Math.floor(diff / 60)
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  return `${Math.floor(hrs / 24)} days ago`
}

interface RealOrder {
  plan_name: string
  plan_variant: { label?: string } | null
  created_at: string
}

interface TickerEntry {
  name: string
  city: string
  plan: string
  variant: string
  time: string
}

function buildFakeEntries(): TickerEntry[] {
  return Array.from({ length: 100 }, () => {
    const minsAgo = Math.floor(Math.random() * 120)
    const secsAgo = Math.floor(Math.random() * 59)
    let time: string
    if (minsAgo === 0) time = secsAgo < 10 ? 'just now' : `${secsAgo} sec ago`
    else time = `${minsAgo} min ago`
    return {
      name: rand(NAMES),
      city: rand(CITIES),
      plan: rand(PLANS),
      variant: rand(VARIANTS),
      time,
    }
  })
}

function buildRealEntries(orders: RealOrder[]): TickerEntry[] {
  return orders.map((o) => ({
    name: rand(NAMES),
    city: rand(CITIES),
    plan: o.plan_name,
    variant: (o.plan_variant as { label?: string })?.label || rand(VARIANTS),
    time: timeAgo(new Date(o.created_at)),
  }))
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function ActivityTicker() {
  const [entries, setEntries] = useState<TickerEntry[]>([])
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fake = buildFakeEntries()
    // Fetch real orders
    fetch('/api/activity')
      .then(r => r.json())
      .then((real: RealOrder[]) => {
        const realEntries = buildRealEntries(real)
        const combined = shuffle([...fake, ...realEntries])
        setEntries(combined)
      })
      .catch(() => {
        setEntries(shuffle(fake))
      })
  }, [])

  if (entries.length === 0) return null

  // Duplicate for seamless loop
  const doubled = [...entries, ...entries]

  return (
    <div className="w-full overflow-hidden bg-black/40 border-b border-white/5 py-2 select-none">
      <div
        ref={trackRef}
        className="ticker-track flex items-center gap-0 whitespace-nowrap"
        style={{ animation: `ticker-scroll ${entries.length * 4}s linear infinite` }}
      >
        {doubled.map((e, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 px-5 text-xs text-zinc-300 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0 animate-pulse" />
            <span className="text-white font-medium">{e.name}</span>
            <span className="text-zinc-500">from</span>
            <span className="text-purple-400 font-medium">{e.city}</span>
            <span className="text-zinc-500">bought</span>
            <span className="text-white font-medium">{e.plan}</span>
            <span className="text-zinc-400">{e.variant}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-500">{e.time}</span>
            <span className="text-zinc-700 ml-3">|</span>
          </span>
        ))}
      </div>
    </div>
  )
}
