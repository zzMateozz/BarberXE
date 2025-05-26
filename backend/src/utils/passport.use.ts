import passport, { Strategy } from 'passport';

export function PassportUse<T extends Strategy, U, V extends (...args: any[]) => void>(
    name: string,
    StrategyType: new (...args: any[]) => T,
    options: U,
    validate: V
): void {
    passport.use(name, new StrategyType(options, validate));
}