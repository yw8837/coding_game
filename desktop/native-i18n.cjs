'use strict';
const messages = {
  en: {
    appExportTitle: 'Export your web app', appExportButton: 'Save HTML app',
    appExportInvalid: 'The app document is invalid or larger than 512 KiB.',
    appExportFailed: 'The app could not be saved. Choose an HTML file and check folder access and free space.',
    archiveExportTitle: 'Export your project files', archiveExportButton: 'Save ZIP',
    archiveExportInvalid: 'The project archive is invalid or larger than 2 MiB.',
    archiveExportFailed: 'The archive could not be saved. Choose a ZIP file and check folder access and free space.',
    timeout: 'The game has not confirmed its final save.',
    saveFailed: 'The latest progress could not be saved.',
    unsaved: 'Your last successfully saved progress remains available. Closing now may lose recent changes.',
    keepPlaying: 'Keep playing', discard: 'Close without saving',
    exportTitle: 'Export Localhost Hero progress backup', exportButton: 'Save backup',
    exportInvalid: 'The backup does not contain valid game progress.',
    exportFailed: 'The backup could not be written. Check free space and folder access.',
    startupTitle: 'Localhost Hero could not start',
    missingBundle: 'The offline game bundle is missing. Build the desktop client before launching.',
    startupFailed: 'The desktop shell could not initialize. Check the packaged files and permissions.',
  },
  ko: {
    appExportTitle: '내 웹앱 내보내기', appExportButton: 'HTML 앱 저장',
    appExportInvalid: '앱 파일 형식이 올바르지 않거나 512 KiB를 넘었어요.',
    appExportFailed: '앱을 저장하지 못했어요. HTML 파일을 선택하고 폴더 접근 권한과 저장 공간을 확인해 주세요.',
    archiveExportTitle: '내 작업 파일 내보내기', archiveExportButton: 'ZIP 저장',
    archiveExportInvalid: '작업 묶음 형식이 올바르지 않거나 2 MiB를 넘었어요.',
    archiveExportFailed: '묶음 파일을 저장하지 못했어요. ZIP 파일을 선택하고 폴더 접근 권한과 저장 공간을 확인해 주세요.',
    timeout: '게임의 마지막 저장 확인이 도착하지 않았어요.',
    saveFailed: '최근 진행 기록을 저장하지 못했어요.',
    unsaved: '마지막으로 저장에 성공한 기록은 남아 있어요. 지금 종료하면 최근 변경 사항이 사라질 수 있어요.',
    keepPlaying: '계속 플레이', discard: '저장하지 않고 종료',
    exportTitle: '로컬호스트 히어로 진행 기록 백업 내보내기', exportButton: '백업 저장',
    exportInvalid: '올바른 게임 진행 기록이 아니어서 백업을 저장하지 못했어요.',
    exportFailed: '백업을 저장하지 못했어요. 저장 공간과 폴더 접근 권한을 확인해 주세요.',
    startupTitle: '로컬호스트 히어로를 시작하지 못했어요',
    missingBundle: '오프라인 게임 파일이 없어요. 실행 전에 데스크톱 게임을 빌드해 주세요.',
    startupFailed: '데스크톱 게임을 준비하지 못했어요. 패키지 파일과 접근 권한을 확인해 주세요.',
  },
  ja: {
    appExportTitle: '自分のウェブアプリを書き出す', appExportButton: 'HTMLアプリを保存',
    appExportInvalid: 'アプリの形式が無効か、512 KiBを超えています。',
    appExportFailed: 'アプリを保存できませんでした。HTMLファイルを選び、フォルダーの権限と空き容量を確認してください。',
    archiveExportTitle: '作業ファイルを書き出す', archiveExportButton: 'ZIPを保存',
    archiveExportInvalid: '作業ファイルの形式が無効か、2 MiBを超えています。',
    archiveExportFailed: 'ZIPを保存できませんでした。ZIPファイルを選び、フォルダーの権限と空き容量を確認してください。',
    timeout: 'ゲームの最終保存を確認できませんでした。',
    saveFailed: '最新の進行状況を保存できませんでした。',
    unsaved: '最後に保存できた進行状況は残っています。今終了すると、最近の変更が失われる可能性があります。',
    keepPlaying: 'プレイを続ける', discard: '保存せずに終了',
    exportTitle: 'ローカルホスト・ヒーローの進行状況をバックアップ', exportButton: 'バックアップを保存',
    exportInvalid: '有効な進行状況ではないため、バックアップを保存できませんでした。',
    exportFailed: 'バックアップを保存できませんでした。空き容量とフォルダーへのアクセス権を確認してください。',
    startupTitle: 'ローカルホスト・ヒーローを起動できませんでした',
    missingBundle: 'オフラインゲームのファイルがありません。起動前にデスクトップ版をビルドしてください。',
    startupFailed: 'デスクトップ版を準備できませんでした。パッケージのファイルとアクセス権を確認してください。',
  },
};
function nativeLanguage(steamLanguage, osLanguages = []) {
  const steam = {koreana: 'ko', english: 'en', japanese: 'ja'}[steamLanguage];
  if (steam) return steam;
  for (const language of osLanguages) {
    const code = String(language).toLowerCase().split(/[-_]/)[0];
    if (messages[code]) return code;
  }
  return 'en';
}
module.exports = {nativeLanguage, messages};
