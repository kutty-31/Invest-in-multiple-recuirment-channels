export const navigation = [
  { id: 'overview', label: 'Overview', icon: '▦' },
  { id: 'channels', label: 'Channels', icon: '▥' },
  { id: 'candidates', label: 'Candidates', icon: '♙' },
]

export const channelRows = [
  { name: 'Employee referral', applicants: 38, hires: 7, rate: '18.4%', quality: '4.8', cost: '$1,420', signal: 'Best quality' },
  { name: 'LinkedIn', applicants: 82, hires: 5, rate: '6.1%', quality: '4.3', cost: '$2,960', signal: 'High volume' },
  { name: 'Careers page', applicants: 47, hires: 3, rate: '6.4%', quality: '4.5', cost: '$1,180', signal: 'Low cost' },
  { name: 'Indeed', applicants: 55, hires: 2, rate: '3.6%', quality: '3.9', cost: '$2,050', signal: 'Optimize' },
]

export const candidateRows = [
  { id: 'candidate-olivia-chen', name: 'Olivia Chen', role: 'Product Designer', source: 'LinkedIn', stage: 'Interview', quality: '5.0', applied: '2 days ago' },
  { id: 'candidate-noah-williams', name: 'Noah Williams', role: 'Backend Engineer', source: 'Employee referral', stage: 'Hired', quality: '5.0', applied: '5 days ago' },
  { id: 'candidate-amara-okafor', name: 'Amara Okafor', role: 'Product Manager', source: 'Careers page', stage: 'Screening', quality: '4.0', applied: '8 days ago' },
  { id: 'candidate-ethan-patel', name: 'Ethan Patel', role: 'Data Analyst', source: 'Indeed', stage: 'Applied', quality: '3.0', applied: '10 days ago' },
]

export const metrics = [
  { label: 'Total applicants', value: '248', change: '↑ 12% vs. prior period', kind: 'applicants' },
  { label: 'Successful hires', value: '18', change: '↑ 3 hires vs. prior period', kind: 'hires' },
  { label: 'Avg. time to hire', value: '31 days', change: '↓ 4 days faster', kind: 'time' },
  { label: 'Cost per hire', value: '$2.4k', change: '↓ 8% vs. prior period', kind: 'cost' },
]

export const stages = [
  { name: 'Applied', count: 248, width: '100%' },
  { name: 'Screening', count: 179, width: '72%' },
  { name: 'Interview', count: 107, width: '43%' },
  { name: 'Hired', count: 18, width: '19%' },
]

export function qualityStars(score) {
  const filled = Math.round(Number(score))
  return `${'★'.repeat(filled)}${'☆'.repeat(5 - filled)}`
}
