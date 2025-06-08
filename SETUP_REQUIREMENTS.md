# Advanced Knowledge Acquisition System - Setup Requirements

## Overview
This document outlines the external dependencies and configuration needed to make the Advanced Knowledge Acquisition System fully functional.

## 1. BunnyNet CDN Integration

### What is BunnyNet?
BunnyNet is a global content delivery network (CDN) that provides fast, reliable file storage and delivery worldwide.

### What You Need:
- **BUNNYNET_ACCESS_KEY**: Your storage zone access key
- **BUNNYNET_STORAGE_ZONE**: Storage zone name (e.g., "therapeutic-docs")

### How to Get It:
1. **Create Account**: Go to https://panel.bunny.net/
2. **Create Storage Zone**:
   - Navigate to "Storage" → "Storage Zones"
   - Click "Add Storage Zone"
   - Choose name: `therapeutic-docs`
   - Select region closest to your users
3. **Get Access Key**:
   - Go to your storage zone
   - Copy the "Password" field (this is your access key)
4. **Add to Environment**:
   ```bash
   BUNNYNET_ACCESS_KEY=your-access-key-here
   BUNNYNET_STORAGE_ZONE=therapeutic-docs
   ```

### Cost:
- Storage: $0.01/GB per month
- Bandwidth: $0.01-0.05/GB depending on region
- Estimated monthly cost for 1000 documents: $2-5

---

## 2. Academic Database API Keys

### What These Are:
Academic databases provide access to research papers, clinical studies, and evidence-based practices through APIs.

### Required APIs:

#### PubMed/NCBI (Free)
- **What**: Medical and life science literature
- **Access**: https://www.ncbi.nlm.nih.gov/account/
- **API Key**: Free with registration
- **Documentation**: https://www.ncbi.nlm.nih.gov/books/NBK25501/
- **Environment Variable**: `PUBMED_API_KEY`

#### Google Scholar (Limited Free)
- **What**: Academic papers across disciplines
- **Access**: Uses web scraping (no official API)
- **Alternative**: SerpApi for Google Scholar ($50/month for 5000 searches)
- **Documentation**: https://serpapi.com/google-scholar-api
- **Environment Variable**: `SERPAPI_KEY`

#### PsycNET/APA (Subscription Required)
- **What**: Psychology and behavioral science research
- **Access**: Through institutional subscription or APA membership
- **Cost**: $199/year individual, varies for institutions
- **Contact**: https://www.apa.org/pubs/databases/psycnet/
- **Environment Variable**: `PSYCNET_API_KEY`

#### Cochrane Library (Subscription/Free Trial)
- **What**: Systematic reviews and evidence-based medicine
- **Access**: https://www.cochranelibrary.com/
- **Free Trial**: 30 days
- **Cost**: $359/year individual
- **Environment Variable**: `COCHRANE_API_KEY`

#### ClinicalTrials.gov (Free)
- **What**: Clinical trial database
- **Access**: https://clinicaltrials.gov/api/
- **API Key**: No key required (public API)
- **Documentation**: https://clinicaltrials.gov/api/gui

### University Access:
If you have university affiliation, many institutions provide free access to these databases. Contact your university library for:
- Database access credentials
- VPN access for off-campus use
- API key requests through institutional accounts

---

## 3. PDF Processing Libraries

### What This Is:
Libraries that extract text and structure from PDF and Word documents for analysis.

### Required Libraries:

#### PDF Processing
```bash
npm install pdf-parse pdf2pic
npm install @types/pdf-parse
```

#### Word Document Processing
```bash
npm install mammoth officegen
npm install @types/mammoth
```

#### Text Analysis
```bash
npm install natural compromise nlp-compromise
npm install @types/natural
```

#### OCR for Scanned PDFs
```bash
npm install tesseract.js
```

### Implementation Steps:
1. **Install Dependencies**:
   ```bash
   npm install pdf-parse mammoth natural tesseract.js
   ```

2. **Update Package Configuration**:
   The system will automatically detect these libraries and enable real PDF/Word processing.

3. **File Size Limits**:
   - Maximum file size: 50MB
   - Supported formats: PDF, DOCX, DOC, TXT
   - OCR enabled for scanned documents

### Cost:
- Libraries: Free (open source)
- Processing: Runs on your server (no external costs)

---

## 4. Local Model Infrastructure

### What This Is:
Local AI models that run on your server to reduce external API costs and provide specialized therapeutic knowledge.

### Infrastructure Options:

#### Option A: Ollama (Recommended for Start)
**What**: Local LLM runner for therapeutic models
**Setup**:
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Download therapeutic models
ollama pull llama2:7b
ollama pull mistral:7b
ollama pull codellama:7b
```

**Requirements**:
- RAM: 16GB minimum (32GB recommended)
- Storage: 50GB for model files
- CPU: Modern multi-core processor

#### Option B: Hugging Face Transformers
**What**: Python-based model hosting
**Setup**:
```bash
# Install Python dependencies
pip install transformers torch accelerate

# Download models for therapeutic applications
python -c "
from transformers import AutoModel, AutoTokenizer
model = AutoModel.from_pretrained('microsoft/BioGPT')
tokenizer = AutoTokenizer.from_pretrained('microsoft/BioGPT')
"
```

**Requirements**:
- RAM: 32GB recommended
- GPU: NVIDIA GPU with 8GB+ VRAM (optional but faster)
- Storage: 100GB for multiple models

#### Option C: Docker Container (Enterprise)
**What**: Containerized model deployment
**Setup**:
```bash
# Pull therapeutic AI container
docker pull huggingface/text-generation-inference:latest

# Run with GPU support
docker run --gpus all -p 8080:80 \
  -v /models:/data \
  huggingface/text-generation-inference:latest \
  --model-id microsoft/BioGPT
```

### Model Types Needed:

#### Cognitive Behavioral Therapy Model
- **Base**: Fine-tuned Llama2 on CBT literature
- **Size**: 7B parameters (~14GB)
- **Specialty**: Thought records, cognitive restructuring

#### Trauma Therapy Model
- **Base**: Fine-tuned Mistral on trauma research
- **Size**: 7B parameters (~14GB)
- **Specialty**: EMDR, exposure therapy protocols

#### Mindfulness Model
- **Base**: Fine-tuned model on mindfulness research
- **Size**: 3B parameters (~6GB)
- **Specialty**: Meditation, stress reduction

#### Crisis Intervention Model
- **Base**: Fine-tuned model on crisis protocols
- **Size**: 7B parameters (~14GB)
- **Specialty**: Risk assessment, safety planning

### Cost Analysis:

#### Hardware Investment:
- **Server Upgrade**: $2,000-5,000 (one-time)
- **Monthly Hosting**: $200-500 (if cloud-hosted)
- **Electricity**: $50-100/month

#### Alternative: Cloud GPU:
- **AWS p3.2xlarge**: $3.06/hour ($2,200/month continuous)
- **Google Cloud V100**: $2.48/hour ($1,786/month continuous)
- **RunPod**: $0.50-1.00/hour ($360-720/month)

#### Recommended Approach:
- **Phase 1**: Start with Ollama on existing hardware
- **Phase 2**: Upgrade to dedicated server if successful
- **Phase 3**: Scale to cloud infrastructure as needed

---

## 5. Database Migration

### What This Does:
Creates the new database tables for knowledge management.

### Steps:
```bash
# Apply database changes
npm run db:push

# Verify tables created
npm run db:studio
```

### New Tables Created:
- `knowledge_sources`: Document and research storage
- `extracted_knowledge`: Therapeutic knowledge extraction
- `model_training_data`: Local model training datasets
- `research_queries`: Autonomous research tracking
- `knowledge_integration`: Performance improvement tracking

---

## 6. Environment Configuration

### Complete .env Setup:
```bash
# Existing variables (keep these)
DATABASE_URL=your-existing-database-url
OPENAI_API_KEY=your-openai-key

# New variables for Advanced Knowledge System
BUNNYNET_ACCESS_KEY=your-bunny-access-key
BUNNYNET_STORAGE_ZONE=therapeutic-docs
PUBMED_API_KEY=your-pubmed-key
SERPAPI_KEY=your-serpapi-key
PSYCNET_API_KEY=your-psycnet-key
COCHRANE_API_KEY=your-cochrane-key

# Local model configuration
OLLAMA_HOST=http://localhost:11434
LOCAL_MODELS_ENABLED=true
MODEL_FALLBACK_ENABLED=true
```

---

## 7. Implementation Phases

### Phase 1: Basic Document Processing (Week 1)
**Requirements**:
- BunnyNet account and API key
- PDF processing libraries
- Database migration

**Capabilities Unlocked**:
- Document upload and storage
- Basic text extraction
- Knowledge database storage

### Phase 2: Academic Research Integration (Week 2-3)
**Requirements**:
- PubMed API key (free)
- SerpApi key for Google Scholar
- Research scheduling system

**Capabilities Unlocked**:
- Autonomous research for each discipline
- Evidence-based content validation
- Research source tracking

### Phase 3: Local Model Deployment (Week 4-6)
**Requirements**:
- Server with 16GB+ RAM
- Ollama installation
- Model fine-tuning infrastructure

**Capabilities Unlocked**:
- 85% cost reduction
- Specialized therapeutic models
- Local processing capabilities

### Phase 4: Advanced Features (Month 2+)
**Requirements**:
- Premium database subscriptions
- Advanced hardware/cloud infrastructure
- Continuous learning systems

**Capabilities Unlocked**:
- Full academic database integration
- Real-time model improvements
- Enterprise-scale deployment

---

## 8. Testing and Validation

### System Tests Available:
```bash
# Test BunnyNet integration
node test-real-bunnynet-integration.js

# Test document processing
node test-document-processing.js

# Test research systems
node test-research-integration.js

# Test local models
node test-local-models.js

# Complete system test
node test-advanced-knowledge-system.js
```

### Success Criteria:
- Documents upload and process successfully
- Research queries return relevant academic sources
- Local models respond with therapeutic accuracy
- Cost savings achieve 70%+ reduction
- System maintains 99%+ uptime

---

## 9. Support and Maintenance

### Monitoring Requirements:
- Database performance tracking
- Model accuracy assessment
- Cost optimization monitoring
- Research source validation

### Update Schedule:
- **Daily**: Autonomous research execution
- **Weekly**: Model performance review
- **Monthly**: Cost analysis and optimization
- **Quarterly**: Database cleanup and archival

### Technical Support:
- System logs: `/logs/knowledge-system.log`
- Error tracking: Built-in error reporting
- Performance metrics: Analytics dashboard
- User feedback: Integrated feedback system

---

## Summary

**Minimum to Start (Phase 1)**:
- BunnyNet account ($5/month)
- PDF processing libraries (free)
- Database migration (free)
- **Total**: $5/month

**Full System (Phase 3)**:
- All above requirements
- Academic database access ($600/year)
- Local model server ($200/month)
- **Total**: $250/month + $2000 hardware

**Expected ROI**:
- Current API costs: $4,500/month
- New total costs: $250/month
- **Monthly savings**: $4,250
- **Payback period**: 2-4 weeks