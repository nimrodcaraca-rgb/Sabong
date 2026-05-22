# Sabong — Gamefowl Management System

> A professional mobile application for managing gamefowl (roosters), built with React Native and Expo. Track health, training, measurements, fight records, and analytics for your entire stable.

---

## Screenshots

| Login | Dashboard | Roosters | Health | Analytics |
|-------|-----------|----------|--------|-----------|
| Auth screen with email and Google sign-in | Stable overview with stats and quick actions | Searchable rooster list with badges | Tabbed health center | Victory Native charts |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native (Expo SDK 54) |
| Development | Expo Go |
| Styling | NativeWind v2 (Tailwind CSS for React Native) |
| Backend / Auth | Supabase (PostgreSQL + Auth + Storage) |
| Navigation | React Navigation — Bottom Tabs + Stack |
| Charts | Victory Native 36.9.2 |
| Notifications | Expo Notifications |
| Image Picker | Expo Image Picker |
| Secure Storage | Expo Secure Store |
| Icons | @expo/vector-icons (AntDesign) |

---

## Features

### Authentication
- Email and password sign up and login
- Google OAuth via Supabase (web browser flow for Expo Go)
- Persistent session across app restarts using Expo Secure Store
- Auto profile creation on sign up via Supabase database trigger

### Dashboard
- Greeting with time of day
- Stable summary — total roosters, total wins, total losses, win rate
- Warning banner if any rooster has not been logged in 7+ days
- Recent roosters preview with photo, bloodline, weight, and win/loss
- Quick action buttons — Log Health, Analytics, Add Rooster, Fight Record
- Pull to refresh

### Rooster Management
- Add roosters with name, bloodline (13 options), birthdate, breeder, pedigree notes, and photo
- Auto age calculator from birthdate
- Photo upload to Supabase Storage using FormData (React Native compatible)
- Assign each rooster to a pen (create pens inline)
- Searchable rooster list filtered by name or bloodline
- Rooster detail screen with full profile, fight stats, latest measurements, and fight history
- Soft delete (mark as inactive) from detail screen

### Pen Management
- Create pens with name and location
- Assign roosters to pens (roosters cannot share pens)
- Pen name shown as badge on rooster cards

### Measurement Logging
- Log per session: weight (kg), wingspan (cm), height (cm), leg length (cm), spur length (cm)
- Body condition score selector (1–10)
- Feather condition picker (Good / Fair / Poor)
- Date picker with notes field
- Latest measurement always shown on rooster detail

### Fight Records
- Log fight date, venue, opponent name, opponent bloodline
- Result picker — Win / Loss / Draw
- Duration in minutes and notes
- Fight history displayed on rooster detail (sorted by date, latest 5 shown)
- Win / loss / draw counts and win rate calculated automatically

### Training Logs
- Session type — Conditioning, Sparring, Rest, Other
- Intensity picker — Low, Medium, High (color coded)
- Duration in minutes with notes

### Health Center (4 tabs)
**Symptoms**
- Select rooster from chip row
- Multi-select symptom chips (12 symptoms including lethargy, loss of appetite, abnormal droppings, respiratory issues, etc.)
- Notes field
- Logs displayed with relative date (Today, Yesterday, X days ago)

**Vaccinations**
- Record vaccine name, date given, next due date, administered by
- Next due date shown as gold pill on log card
- Auto-schedules Expo push notification 3 days before next due date

**Vet Visits**
- Record visit date, vet name, reason, diagnosis, treatment, next visit date
- Auto-schedules push notification 1 day before next visit

**Feeding Logs**
- Record feed type, amount in grams, supplements (comma separated), notes
- Supplements displayed as teal tags on log card

### Analytics (3 tabs)
**Overview**
- Stable-wide stats grid (total roosters, wins, losses, win rate)
- Per-rooster breakdown with win/loss count, win rate percentage bar, and weight

**Growth Charts**
- Select any rooster to view their charts
- Weight over time — gold line chart
- Spur length over time — teal line chart
- Wingspan over time — purple line chart
- Empty state with guidance if fewer than 2 data points

**Fight Charts**
- Win/Loss/Draw donut (pie) chart per rooster
- Wins across stable — bar chart comparing all roosters
- Legend with color coding

### Push Notifications
- Permission request on first login
- Vaccination reminders — 3 days before next due date
- Vet visit reminders — 1 day before next visit
- Daily feeding reminder — configurable hour (0–23), repeating
- Inactivity alert — if a rooster has not been logged in 7 days
- Android notification channel with gold accent color

### Profile and Settings
- Avatar with first letter of name
- Edit full name and stable name (saved to Supabase profiles table)
- Daily feeding reminder toggle with configurable time
- Push token display for debugging
- App version, platform, account email, member since date
- Sign out with confirmation dialog
- Delete account (routes to support)

---

## Project Structure

```
Sabong/
├── app/
│   ├── (auth)/
│   │   ├── LoginScreen.jsx         # Email + Google login
│   │   └── SignUpScreen.jsx        # Email sign up
│   ├── (tabs)/
│   │   ├── DashboardScreen.jsx     # Home tab
│   │   ├── RoostersScreen.jsx      # Rooster list tab
│   │   ├── AddRoosterScreen.jsx    # Add rooster tab
│   │   ├── HealthScreen.jsx        # Health center tab
│   │   └── AnalyticsScreen.jsx     # Analytics tab
│   ├── rooster/
│   │   ├── RoosterDetailScreen.jsx # Full rooster profile
│   │   ├── MeasurementLogScreen.jsx
│   │   ├── FightRecordScreen.jsx
│   │   └── TrainingLogScreen.jsx
│   └── ProfileScreen.jsx           # Profile and settings
├── components/                     # Shared UI components
├── constants/
│   └── theme.js                    # COLORS, BLOODLINES, SYMPTOMS
├── context/
│   └── AuthContext.jsx             # Auth state, signIn, signUp, Google OAuth
├── hooks/
│   ├── useRoosters.js              # Fetch roosters + getStats()
│   ├── usePens.js                  # Fetch + create pens
│   └── useNotifications.js         # Push notification scheduling
├── lib/
│   └── supabase.js                 # Supabase client with SecureStore adapter
├── navigation/
│   ├── AppNavigator.jsx            # Stack navigator (authenticated)
│   ├── TabNavigator.jsx            # Bottom tab navigator
│   └── AuthNavigator.jsx           # Auth stack
├── assets/
│   └── sabong_favicon.png
├── .env                            # Environment variables (not committed)
├── app.json
├── babel.config.js
├── tailwind.config.js
└── App.jsx                         # Root with AuthProvider + NavigationContainer
```

---

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `profiles` | Extends Supabase auth.users — full name, stable name, avatar |
| `pens` | Individual pen records per user |
| `roosters` | Core rooster records with bloodline, birthdate, photo, pen assignment |
| `measurement_logs` | Weight, wingspan, height, leg length, spur length, body condition, feather condition |
| `health_logs` | Symptom arrays and notes per rooster |
| `vaccination_records` | Vaccine name, date given, next due date, administered by |
| `vet_visits` | Visit date, vet name, reason, diagnosis, treatment, next visit |
| `feeding_logs` | Feed type, amount, supplements array, vitamins, notes |
| `training_logs` | Session type, intensity, duration, notes |
| `fight_records` | Fight date, venue, opponent, result, duration, notes |
| `breeding_pairs` | Sire, dam name and bloodline, pairing date |

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only read and write their own data
- Measurement, health, training, fight, feeding, vaccination, and vet records are scoped through the parent rooster's user_id

### Storage
- Bucket: `rooster-photos` (public)
- Upload policy: authenticated users only
- Files stored as `{user_id}/{timestamp}.{ext}`

---

## Environment Variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> Never commit your `.env` file. It is already listed in `.gitignore`.

---

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- Expo Go app on your Android or iOS device
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/sabong.git
cd sabong

# Install dependencies
npm install

# Install missing babel preset if needed
npm install --save-dev babel-preset-expo tailwindcss@3.3.2

# Start the development server
npx expo start --clear
```

### Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the full schema from `supabase/schema.sql`
3. Go to Authentication → Providers → Email and disable email confirmation for development
4. Go to Authentication → Providers → Google and add your Google OAuth credentials
5. Copy your Project URL and anon key into `.env`

### Google OAuth Setup (optional)

1. Create a project at [console.cloud.google.com](https://console.cloud.google.com)
2. Create an OAuth 2.0 Web Client ID
3. Add your Supabase callback URL as an authorized redirect URI:
   ```
   https://your-project-id.supabase.co/auth/v1/callback
   ```
4. Paste the Client ID and Secret into Supabase → Authentication → Providers → Google

---

## Bloodlines Supported

Sweater, Hatch, Kelso, Roundhead, Asil, Radio, Lemon 84, Claret, Grey, Butcher, Albany, Blueface, Other

---

## Symptom Tracking

Lethargy, Loss of appetite, Abnormal droppings, Respiratory issues, Swollen joints, Eye discharge, Feather loss, Limping, Pale comb, Diarrhea, Vomiting, Weight loss

---

## Roadmap

- [ ] Edit rooster profile after creation
- [ ] Breeding pair tracker UI
- [ ] Export data as PDF or CSV
- [ ] Multi-language support (Filipino / English)
- [ ] Dark / light theme toggle
- [x] Offline mode with local sync (basic cache + queued writes)
- [ ] EAS Build for standalone APK with native Google sign-in modal
- [ ] Supplement and vitamin schedule with reminders
- [ ] Cloud backup and restore

---

## Known Limitations

- Google sign-in opens a browser tab in Expo Go (native modal requires a custom dev build via EAS)
- Victory Native v36.9.2 is used for Expo Go compatibility (v41+ requires different setup)
- Push notifications require a physical device (will not work in simulators)
- Photo upload uses FormData — blob upload does not work in React Native

---

## Contributing

Pull requests are welcome. For major changes please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Acknowledgements

Built for Filipino sabongeros who take their birds seriously. 🐓

> This app is framed as a neutral gamefowl management and tracking tool suitable for breeders, trainers, and enthusiasts worldwide.
