import { User } from '@fusionauth/typescript-client';

interface JSONObject {
    [key: string]: any;
}
interface FieldError {
    message: string;
}
interface ResponseNode {
    success: string;
    errors?: string[] | FieldError[];
    data?: Record<string, any>;
}
declare const findApplicationByID: (applicationID: string) => Promise<boolean>;
declare const findFAUserByUsername: (username: string) => Promise<User | undefined>;
declare const findByEmail: (email: string) => Promise<User | undefined>;
declare const jsonArrayToList: (userPhonesResponse: any[]) => string[];
declare const getUsersFromFederatedServers: (campaignID: string, meta: Record<string, string> | null) => Promise<any[] | null>;
declare const getUsersMessageByTemplate: (jsonData: any) => Promise<any[] | null>;
declare const getManager: (applicant: User) => Promise<Nullable<User>>;
declare const getProgramCoordinator: (applicant: User) => Promise<Nullable<User>>;
declare const getProgramConstruct: (applicant: User) => string;
declare const getEngagementOwner: (applicant: User) => Promise<User | null>;
type Nullable<T> = T | null;
declare const getUserByFullName: (fullName: string, campaignName: string) => Promise<Nullable<User>>;
declare const isAssociate: (applicant: User) => boolean;
declare const getUserByPhoneFromFederatedServers: (campaignID: string, phone: string) => Promise<JSONObject | null>;
declare const createFAUser: (node: Record<string, any>) => Promise<ResponseNode | null>;
declare const updateFAUser: (userId: string, node: Record<string, any>) => Promise<ResponseNode | null>;

export { createFAUser, findApplicationByID, findByEmail, findFAUserByUsername, getEngagementOwner, getManager, getProgramConstruct, getProgramCoordinator, getUserByFullName, getUserByPhoneFromFederatedServers, getUsersFromFederatedServers, getUsersMessageByTemplate, isAssociate, jsonArrayToList, updateFAUser };
