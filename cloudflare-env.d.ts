declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    DASHBOARD_OWNER_EMAIL?: string;
    DEMO_METRICS_SALT?: string;
    BUCKET?: R2Bucket;
  }
}
