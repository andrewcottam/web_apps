import {CheckStatus} from '../types/Enums';

export interface Check {
    /**
     * The name of the check
     */
    name: string,
    /**
     * The status of the check
     */
    status: CheckStatus,
    /**
     * The message for the check
     */
    status_message: string,
    /**
     * The thresholds for any numerical data
     */
    thresholds: number | Record<string, any>,
    /**
     * The value of the check
     */
    value: any,
}