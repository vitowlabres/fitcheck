import { Injectable } from '@angular/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection
} from '@capacitor-community/sqlite';

@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private isReady: Promise<void>;
  private readyResolver!: () => void;

  constructor() {
    // Cria a instância de conexão SQLite
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
    this.isReady = new Promise(resolve => {
      this.readyResolver = resolve;
    });
  }

  /**
   * Inicializa o banco de dados e cria as tabelas, se necessário.
   */
  async initializeDatabase(): Promise<void> {
  console.log('[DB] Inicializando...');

  if ((window as any).Capacitor?.getPlatform?.() === 'web') {
    try {
      (CapacitorSQLite as any).wasmPath = "assets/wasm";
      await (CapacitorSQLite as any).initWebStore();
      console.log('[DB] initWebStore chamado com sucesso');
    } catch (err) {
      console.error('[DB] Erro no initWebStore:', err);
    }
  }

  console.log('[DB] após if linha 24...');
  try {
    let db: SQLiteDBConnection;

    try {
      const isConn = (await this.sqlite.isConnection('fitcheckDB', false)).result;
      if (isConn) {
        db = await this.sqlite.retrieveConnection('fitcheckDB', false);
        console.log('[DB] if isConn...');
      } else {
        db = await this.sqlite.createConnection('fitcheckDB', false, 'no-encryption', 1, false);
        console.log('[DB] Else isConn...');
      }
    } catch {
      // fallback direto para criar conexão
      db = await this.sqlite.createConnection('fitcheckDB', false, 'no-encryption', 1, false);
      console.log('[DB] catch...');
    }

    await db.open();
    this.db = db;
    console.log('[DB] Conexão aberta');

    await this.createTables();
    await this.populateTreinos();
    this.readyResolver();
  } catch (err) {
    console.error('[DB] Erro ao inicializar:', err);
  }
}

async ready(): Promise<void> {
  return this.isReady;
}


  /**
   * Cria tabelas iniciais do banco.
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('DB não aberto');
    // tabela de exercícios
    const createExercicios = `
        CREATE TABLE IF NOT EXISTS exercicios (
        id_exercicio INTEGER PRIMARY KEY AUTOINCREMENT,
        nome_exercicio TEXT NOT NULL,
        grupo_muscular TEXT
        );
    `;

    const createTreinos = `
      CREATE TABLE IF NOT EXISTS treinos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_treino INTEGER NOT NULL,
        nome_treino TEXT NOT NULL,
        id_exercicio INTEGER NOT NULL,
        carga_meta INTEGER,
        series_meta INTEGER,
        repeticao_meta INTEGER
      );
    `;

    await this.db.execute(createExercicios);
    await this.db.execute(createTreinos);
  }

  /**
   * Popula a tabela treinos com alguns exemplos
   */
  private async populateTreinos(): Promise<void> {
    if (!this.db) throw new Error('DB não aberto');

    const count = await this.db.query('SELECT COUNT(*) as total FROM treinos;');
    if (count.values && count.values[0].total > 0) {
      return; // já populado
    }

    // popula exercícios primeiro
    await this.db.run(`INSERT INTO exercicios (nome_exercicio, grupo_muscular) VALUES (?, ?)`, ["Leg Press", "Pernas"]);
    await this.db.run(`INSERT INTO exercicios (nome_exercicio, grupo_muscular) VALUES (?, ?)`, ["Agachamento Livre", "Pernas"]);
    await this.db.run(`INSERT INTO exercicios (nome_exercicio, grupo_muscular) VALUES (?, ?)`, ["Cadeira Extensora", "Pernas"]);

     // pega IDs criados
    const exercicios = await this.db.query('SELECT * FROM exercicios;');

    const sql = `
      INSERT INTO treinos 
        (id_treino, nome_treino, id_exercicio, carga_meta, series_meta, repeticao_meta) 
      VALUES 
        (?, ?, ?, ?, ?, ?);
    `;

    const treinosExemplo = [
      [1, 'Leg Press', exercicios.values![0].id_exercicio, 200, 4, 12],
      [1, 'Agachamento Livre', exercicios.values![1].id_exercicio, 100, 4, 8],
      [1, 'Cadeira Extensora', exercicios.values![2].id_exercicio, 80, 3, 10],
    ];

    for (const treino of treinosExemplo) {
      await this.db.run(sql, treino);
    }
  }

  /**
   * Busca todos os treinos
   */
  async getTreinos(): Promise<string[]> {
    if (!this.db) throw new Error('DB não aberto');

    const result = await this.db.query(
      'SELECT nome_treino FROM treinos'
    );

    // retorna apenas uma lista de nomes
    return result.values?.map((row: any) => row.nome_treino) || [];
  }

  /**
   * Adiciona um treino novo
   */
  async addTreino(
    id_treino: number,
    nome_treino: string,
    id_exercicio: number,
    carga_meta: number,
    series_meta: number,
    repeticao_meta: number
  ): Promise<void> {
    if (!this.db) throw new Error('DB não aberto');
    const sql = `
      INSERT INTO treinos 
        (id_treino, nome_treino, id_exercicio, carga_meta, series_meta, repeticao_meta)
      VALUES (?, ?, ?, ?, ?, ?);
    `;
    await this.db.run(sql, [
      id_treino,
      nome_treino,
      id_exercicio,
      carga_meta,
      series_meta,
      repeticao_meta,
    ]);
  }

  /**
   * Retorna o id_exercicio a partir do nome_exercicio
   */
  async getExercicioIdByNome(nome_exercicio: string): Promise<number | null> {
    if (!this.db) throw new Error('DB não aberto');

    const res = await this.db.query(
      'SELECT id_exercicio FROM exercicios WHERE nome_exercicio = ? LIMIT 1;',
      [nome_exercicio]
    );

    if (res.values && res.values.length > 0) {
      return res.values[0].id_exercicio;
    }
    return null; // não encontrado
  }

  /**
   * Retorna todos os nomes de exercícios cadastrados
   */
  async getNomesExercicios(): Promise<string[]> {
    if (!this.db) throw new Error('DB não aberto');

    const res = await this.db.query('SELECT nome_exercicio FROM exercicios;');

    if (res.values) {
      return res.values.map(row => row.nome_exercicio);
    }
    return [];
  }

  /**
   * Fecha a conexão com o banco.
   */
  async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.sqlite.closeConnection('appDB', false);
      this.db = null;
    }
  }


}

