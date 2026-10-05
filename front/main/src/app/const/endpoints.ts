
export const endpoints = {
  article:{
    create: `/api/articles`,
    update:(id:number)=>`/api/articles/${id}`,
    delete:(id:number)=>`/api/articles/${id}`,
    list:`/api/articles`,
  },
  client:{
    create: `/api/clients`,
    update:(id:number)=>`/api/clients/${id}`,
    delete:(id:number)=>`/api/clients/${id}`,
    list:`/api/clients`,
  },
  shared : {
    getCptFacture:`/api/shared/cptfacture`,
    getCptDevis:`/api/shared/cptdevis`,
    getCptBl:`/api/shared/cptbl`,
    sendEmail: `/api/shared/emails/send-with-attachment`,
  },
  user: {
    create: `/api/users`,
    update:(id:number)=> `/api/users/${id}`,
    getUser:(id:number)=> `/api/users/${id}`,
    getLogin: `/api/users/login`,
    delete:(id:number)=> `/api/users/${id}`,
    list: `/api/users`,
    activate:(id:number)=> `/api/users/${id}/activate`,
    deactivate:(id:number)=> `/api/users/${id}/deactivate`,
  },
  devis: {
    create: `/api/devis`,
    update: (id: number) => `/api/devis/${id}`,
    delete: (id: number) => `/api/devis/${id}`,
    list: `/api/devis`,
    listLast: `/api/last-devis`,
    updateStatut: (id: number,statut:string) => `/api/devis/${id}/${statut}`,
  },
  facture: {
    create: (id: number) =>`/api/factures/${id}`,
    update: (id: number) => `/api/factures/${id}`,
    delete: (id: number) => `/api/factures/${id}`,
    list: `/api/factures`,
    listLast: `/api/last-factures`,
    updateStatut: (id: number,statut:string) => `/api/factures/${id}/${statut}`,
  },
  bl: {
    create: (id: number) => `/api/bls/${id}`,
    update: (id: number) => `/api/bls/${id}`,
    delete: (id: number) => `/api/bls/${id}`,
    list: `/api/bls`,
    listLast: `/api/last-bls`,
    updateStatut: (id: number,statut:string)  => `/api/bls/${id}/${statut}`,
  },
  file: {
    genererPDF :  '/api/download-pdf'
  },
  traceability : {
    getAllOperations: `/api/traceability`,
    logOperation: `/api/traceability`,
  }
};
