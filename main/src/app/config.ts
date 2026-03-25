export const BASE_URL = 'https://splendorart.ma/app/api/index.php';
// export const BASE_URL = 'http://localhost:8000';

export interface AppSettings {

  sidenavOpened: boolean;
  sidenavCollapsed: boolean;

}

export const defaults: AppSettings = {
  sidenavOpened: false,
  sidenavCollapsed: false,
};
