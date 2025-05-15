
# NewsBlogify: AI 기반 뉴스 블로그 자동 생성기

NewsBlogify는 최신 뉴스 키워드를 기반으로 AI를 활용하여 블로그 게시물 초안을 생성하고, 이를 정교화하며, 관련 이미지를 손쉽게 추가할 수 있도록 도와주는 Next.js 기반 웹 애플리케이션입니다. 콘텐츠 제작 과정을 간소화하고 아이디어를 빠르게 실제 블로그 글로 전환할 수 있도록 설계되었습니다.

## ✨ 주요 기능

-   **뉴스 키워드 기반 초안 생성**:
    -   네이버 뉴스 랭킹 키워드를 가져와 (현재는 목업 데이터, 실제 스크래핑 로직 구현 필요) 관심 있는 주제를 선택합니다.
    -   선택된 키워드를 바탕으로 AI가 해당 키워드가 포함된 가상의 "원본 뉴스 기사" 내용을 생성합니다.
    -   생성된 가상 원본 기사를 기반으로 AI가 한국어 블로그 게시물 초안(마크다운 형식)을 작성합니다.
-   **AI를 통한 내용 상세화**:
    -   생성된 초안을 바탕으로 AI가 내용을 더욱 풍부하고 상세하게 만들어줍니다.
-   **Pixabay 이미지 검색 및 삽입**:
    -   블로그 내용과 관련된 이미지를 Pixabay API를 통해 검색하고 (API 키 필요) 선택하여 게시물에 쉽게 삽입할 수 있습니다.
    -   이미지는 현재 선택된 콘텐츠 형식(마크다운 또는 HTML)에 맞춰 자동으로 삽입됩니다.
-   **콘텐츠 형식 변환**:
    -   작성 중인 블로그 내용을 마크다운(Markdown)과 HTML 형식 간에 실시간으로 변환하며 편집할 수 있습니다.
    -   제목, 강조, 이미지, 링크, 수평선, 기본 단락 구조 등을 포함하여 변환합니다.
-   **사용자 친화적 인터페이스**:
    -   ShadCN UI 컴포넌트와 Tailwind CSS를 사용하여 깔끔하고 현대적인 UI를 제공합니다.
    -   진행 상황에 따른 로딩 상태 및 토스트 메시지로 사용자 경험을 향상시킵니다.

## 🚀 시작하기

### 사전 준비 사항

-   Node.js (v18 이상 권장)
-   npm 또는 yarn
-   Pixabay API 키: 이미지 검색 기능을 사용하려면 Pixabay에서 API 키를 발급받아야 합니다.
    -   [Pixabay API 문서 및 키 발급](https://pixabay.com/api/docs/)

### 설정 방법

1.  **프로젝트 클론 및 의존성 설치**:
    ```bash
    # 아직 프로젝트를 받지 않았다면
    # git clone <repository_url>
    # cd <repository_name>

    npm install
    # 또는
    # yarn install
    ```

2.  **환경 변수 설정**:
    프로젝트 루트 디렉터리에 `.env` 파일을 생성하고 다음과 같이 Pixabay API 키를 추가합니다. `YOUR_PIXABAY_API_KEY` 부분을 실제 발급받은 키로 대체해주세요.

    ```env
    PIXABAY_API_KEY=YOUR_PIXABAY_API_KEY
    ```

    *   **중요**: `.env` 파일은 Git과 같은 버전 관리 시스템에 포함되지 않도록 주의하세요 (`.gitignore`에 추가되어 있는지 확인).

3.  **Genkit 설정 (이미 되어있음)**:
    이 프로젝트는 Google의 Genkit을 사용하여 AI 기능을 구현합니다. `src/ai/genkit.ts` 파일에 기본 설정이 포함되어 있습니다.

### 실행 방법

NewsBlogify는 Next.js 프론트엔드와 Genkit 백엔드(AI 로직 처리) 두 부분으로 실행됩니다. 개발 시에는 두 개의 터미널 세션이 필요합니다.

1.  **Genkit 개발 서버 실행**:
    첫 번째 터미널에서 다음 명령어를 실행하여 Genkit 플로우 개발 서버를 시작합니다. 이 서버는 AI 관련 요청을 처리합니다.

    ```bash
    npm run genkit:dev
    # 또는 (파일 변경 시 자동 재시작)
    # npm run genkit:watch
    ```
    Genkit UI는 기본적으로 `http://localhost:4000` 에서 접근할 수 있습니다.

2.  **Next.js 개발 서버 실행**:
    두 번째 터미널에서 다음 명령어를 실행하여 Next.js 애플리케이션을 시작합니다.

    ```bash
    npm run dev
    ```
    애플리케이션은 기본적으로 `http://localhost:9002` (또는 package.json에 설정된 포트)에서 실행됩니다. 브라우저에서 이 주소로 접속하여 앱을 사용할 수 있습니다.

## 🔧 커스터마이징 및 주요 파일 안내

-   **AI 플로우 (Genkit)**:
    -   `src/ai/flows/`: 이 디렉터리에는 AI 관련 로직(플로우)들이 정의되어 있습니다.
        -   `fetch-naver-news-keywords.ts`: 네이버 뉴스 랭킹 키워드를 가져오는 플로우입니다. **현재 목업(mock) 데이터를 사용하며, 실제 웹 스크래핑 로직을 구현해야 합니다.** 주석 처리된 부분과 `axios`, `cheerio` 라이브러리 사용 예시를 참고하여 직접 구현할 수 있습니다. (라이브러리 설치 필요: `npm install axios cheerio`)
        -   `generate-blog-draft.ts`: 선택된 키워드를 기반으로 가상 원본 기사 및 블로그 초안을 생성하는 플로우입니다. 프롬프트를 수정하여 AI의 응답 스타일을 변경할 수 있습니다. **이 플로우 내에서 가상 원본 기사를 생성하는 부분도 실제 기사 내용을 스크래핑하도록 확장할 수 있습니다.**
        -   `elaborate-blog-content.ts`: 생성된 초안을 상세화하는 플로우입니다.
        -   `fetch-pixabay-images.ts`: Pixabay API를 사용하여 이미지를 검색하는 플로우입니다.
    -   `src/ai/genkit.ts`: Genkit 초기화 및 기본 모델 설정 파일입니다.
    -   `src/ai/dev.ts`: Genkit 개발 서버가 로드하는 플로우 목록입니다. 새로운 플로우를 추가하면 여기에 임포트해야 합니다.

-   **프론트엔드 (Next.js & React)**:
    -   `src/app/page.tsx`: 메인 애플리케이션 페이지의 UI 및 클라이언트 로직이 포함된 파일입니다.
    -   `src/components/ImageSelectionDialog.tsx`: 이미지 검색 및 삽입 팝업 관련 로직이 포함된 파일입니다.
    -   `src/components/ui/`: ShadCN UI 컴포넌트들이 위치합니다.
    -   `src/app/globals.css`: 전역 CSS 및 Tailwind CSS, ShadCN 테마 변수 설정 파일입니다.

-   **Next.js 설정**:
    -   `next.config.ts`: Next.js 관련 설정 파일입니다. 이미지 호스트네임(`images.remotePatterns`에 `cdn.pixabay.com`과 `pixabay.com`이 추가되어 있습니다) 등을 설정합니다.

## 🛠️ 사용된 주요 기술

-   **Next.js**: React 프레임워크 (App Router 사용)
-   **React**: 사용자 인터페이스 구축
-   **TypeScript**: 타입 안정성
-   **Genkit (Google AI)**: AI 기능 구현 (Gemini 모델 활용)
-   **ShadCN UI**: UI 컴포넌트 라이브러리
-   **Tailwind CSS**: CSS 스타일링
-   **Zod**: 데이터 유효성 검사
-   **Axios**: HTTP 클라이언트 (Pixabay API 호출 및 스크래핑 구현 시 사용)
-   **Lucide React**: 아이콘 라이브러리

## 💡 향후 개선 아이디어

-   실제 네이버 뉴스 스크래핑 기능 완성
-   블로그 초안 생성 시, 가상 원문 대신 실제 스크래핑한 기사 내용 활용
-   다양한 AI 모델 연동 옵션 추가
-   생성된 콘텐츠 저장 및 관리 기능
-   SEO 최적화 기능
-   더 많은 콘텐츠 형식 지원 (예: DOCX, PDF 내보내기)

---

이 README가 NewsBlogify 프로젝트를 이해하고 활용하는 데 도움이 되기를 바랍니다!
