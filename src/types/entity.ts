export type EntityCode = 'FFSL' | 'FFVL';

export interface Entity {
    id: number;
    code: EntityCode;
    name: string;
    country: string;
}
