# INC Collega Chat

A modern chat application for INC with password-protected access and Mistral AI integration for intelligent conversations with multiple colleagues.

## Features

- **Password-Protected Access**: Secure authentication using Vercel environment variables
- **Multiple AI Colleagues**: Chat with Dennis (Merk specialist) and Niels (Design Expert) powered by Mistral AI Agents
- **File Management**: Upload files directly to Mistral's knowledge base for agent training
- **Conversation History**: Maintains chat history per colleague with persistent storage
- **Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI**: Mistral AI Agents API
- **Storage**: Mistral File Storage API
- **Authentication**: Secure cookie-based sessions with SHA-256 hashing

## Environment Variables

### Local Development

Create a `.env.local` file (see `.env.example` for template):

```env
# Mistral AI Configuration
MISTRAL_API_KEY=your-mistral-api-key
MISTRAL_AGENT_ID_DENNIS=your-dennis-agent-id
MISTRAL_WORKSPACE_ID_DENNIS=your-dennis-workspace-id
MISTRAL_AGENT_ID_NIELS=your-niels-agent-id
MISTRAL_WORKSPACE_ID_NIELS=your-niels-workspace-id

# File Upload Configuration
MAX_UPLOAD_MB=20

# Authentication
APP_PASSWORD=your-secure-password
```

### Production (Vercel)

Set these environment variables in **Vercel Project Settings → Environment Variables**:

- `MISTRAL_API_KEY`: Your Mistral API key
- `MISTRAL_AGENT_ID_DENNIS`: Dennis agent ID from Mistral Studio
- `MISTRAL_WORKSPACE_ID_DENNIS`: Dennis workspace ID from Mistral Studio
- `MISTRAL_AGENT_ID_NIELS`: Niels agent ID from Mistral Studio
- `MISTRAL_WORKSPACE_ID_NIELS`: Niels workspace ID from Mistral Studio
- `MAX_UPLOAD_MB`: Maximum file upload size (default: 20)
- `APP_PASSWORD`: Secure password for app access

**⚠️ IMPORTANT**: The `APP_PASSWORD` variable must ONLY be set in Vercel environment variables. **Never commit it to the repository.**

## Colleague Configuration

Each colleague is configured as a Mistral AI Agent with:

- **Agent ID**: Unique identifier from Mistral Studio
- **Workspace ID**: Associated Mistral workspace for file storage
- **Role**: Specialized expertise

### Current Colleagues

| Colleague | Role | Status |
|-----------|------|--------|
| Dennis | Merk specialist | ✅ Active |
| Niels | Design Expert | ✅ Active |

## Getting Started

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/PeterPeterinc/Baind-INC-webapp.git
cd Baind-INC-webapp
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` with your configuration:
```bash
cp .env.example .env.local
# Then edit .env.local with your actual credentials
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser

### Authentication

- The app is password-protected
- Login with the password set in `APP_PASSWORD` environment variable
- Sessions are stored in secure HTTP-only cookies
- Session duration: 7 days

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel at [vercel.com](https://vercel.com)
3. Set all required environment variables in Vercel Project Settings
4. Vercel will automatically deploy on every push to main branch

**Important**: Ensure `APP_PASSWORD` is set in Vercel environment variables before deploying.

## Security

- Passwords are never stored in plain text
- Session tokens are SHA-256 hashed
- All API routes validate origin and rate limit
- Environment variables are never committed to repository
- Use `.env.local` for local development (it's in `.gitignore`)

## API Routes

- `POST /api/auth/login` - Authenticate with password
- `POST /api/auth/logout` - Logout and clear session
- `POST /api/chat` - Send message to colleague's Mistral agent
- `GET /api/storage` - List uploaded files
- `POST /api/storage/upload` - Upload file to Mistral
- `DELETE /api/storage/[id]` - Delete file from Mistral

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Mistral AI Documentation](https://docs.mistral.ai)
- [Vercel Documentation](https://vercel.com/docs)

## License

MIT
