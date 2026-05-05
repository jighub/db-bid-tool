import { createClient } from '@supabase/supabase-js'
import BidTool from '@/components/BidTool'
import Header from '@/components/Header'
import type { Opportunity } from '@/lib/types'

async function getOpportunities(): Promise<Opportunity[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data, error } = await supabase
    .from('bid_opportunities')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch opportunities:', error.message)
    return []
  }
  return (data ?? []) as Opportunity[]
}

export default async function Page() {
  const opportunities = await getOpportunities()

  return (
    <>
      <Header />
      <BidTool initialOpportunities={opportunities} />
    </>
  )
}
