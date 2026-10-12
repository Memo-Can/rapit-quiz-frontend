export interface Category {
  id: number
  slug: string
  name: string
  icon: string
  color: string
}

export interface SessionCreated {
  session_id: string
  category: string
  question_count: number
}

export interface Choice {
  id: number
  text: string
}

export interface Question {
  position: number
  total_questions: number
  text: string
  choices: Choice[]
  time_limit_ms: number
  remaining_ms: number
}

export interface AnswerResult {
  is_correct: boolean
  correct_choice_id: number
  score_gained: number
  finished: boolean
}

export interface GameResult {
  category: string
  total_score: number
  correct_count: number
  question_count: number
  total_time_ms: number
  score_submitted: boolean
}

export interface ScoreSubmitted {
  entry_id: number
  rank: number
  player_name: string
  score: number
}

export interface LeaderboardEntry {
  rank: number
  entry_id: number
  player_name: string
  score: number
  correct_count: number
  total_time_ms: number
}
