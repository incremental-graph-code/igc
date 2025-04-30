
/**
 * SyncSystem is an enum that represents different types of predefined syncable systems.
 */
export enum SyncSystem {
    Text,
    Graph,
    Snippet,
    Node,
    Relationship
}

/**
 * SyncID is a type that represents the identifier of a syncable system.
 * The system ID can be a string or a predefined SyncSystem enum.
 */
export type SyncID = SyncSystem | string;