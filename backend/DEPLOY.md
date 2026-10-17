# Deploy do backend (Render + Supabase)

O backend roda no Render como container Docker; o banco é o Postgres do Supabase.
O frontend fica no Vercel e repassa as chamadas de API para o Render.

## 1. Supabase (banco)

1. Crie o projeto no Supabase e anote a senha do banco.
2. Em **Connect**, copie a string do **Session pooler** (porta **5432**).
   - Não use a conexão direta (`db.<ref>.supabase.co`): ela só funciona via IPv6, que o Render não tem.
   - Não use o *Transaction pooler* (porta 6543): ele não é compatível com o Flyway.
3. Converta para o formato JDBC:

   | Variável | Valor |
   |---|---|
   | `SPRING_DATASOURCE_URL` | `jdbc:postgresql://aws-0-<regiao>.pooler.supabase.com:5432/postgres?sslmode=require` |
   | `SPRING_DATASOURCE_USERNAME` | `postgres.<project-ref>` |
   | `SPRING_DATASOURCE_PASSWORD` | a senha do banco |

As tabelas são criadas pelo Flyway na primeira subida; não rode SQL à mão.

## 2. Render (backend)

1. No Render: **New → Blueprint** e selecione este repositório. O `render.yaml` da raiz cria o serviço.
2. Preencha as variáveis pedidas (as de `sync: false`):
   - as três do banco (acima);
   - `GEMINI_API_KEY` e `CLOUDINARY_URL`;
   - `ADMIN_EMAIL` e `ADMIN_PASSWORD` (mínimo 12 caracteres): o ADMIN é criado na primeira subida;
   - `CORS_ALLOWED_ORIGINS`: a URL do frontend no Vercel.
3. Aguarde o deploy e confira `https://<servico>.onrender.com/actuator/health` → `{"status":"UP"}`.

Já vem configurado no `render.yaml`: cookie de sessão `Secure`, cadastro público desligado
(`REGISTRATION_ENABLED=false`), pool de 5 conexões e o modelo do Gemini.

## 3. O que o frontend precisa (Vercel)

A sessão usa cookie e o CSRF usa o cookie `XSRF-TOKEN`, lido pelo JavaScript. Se o navegador
falar direto com `*.onrender.com`, ele não consegue ler esse cookie (é de outro domínio) e todo
POST volta 403. Por isso o Vercel deve **repassar** as chamadas para o Render, mantendo tudo na
mesma origem. No projeto do frontend, um `vercel.json` com:

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://<servico>.onrender.com/api/:path*" },
    { "source": "/logout", "destination": "https://<servico>.onrender.com/logout" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## Observações

- **Plano gratuito do Render:** o serviço hiberna após ~15 min sem uso; a primeira requisição
  depois disso demora cerca de 1 minuto.
- **Limiar do alerta:** `ALERTA_LIMIAR_NIVEL_ALTO` (padrão `0.6`). Ver `ImageAnalysisPrompt`.
- **Limite de upload:** `UPLOAD_MAX_FILE_SIZE` (padrão `10MB`).
