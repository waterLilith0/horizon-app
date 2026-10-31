namespace horizon_api.Shared
{
    /// <summary>Which items a list endpoint returns for the current user.</summary>
    [System.Text.Json.Serialization.JsonConverter(typeof(System.Text.Json.Serialization.JsonStringEnumConverter))]
    public enum ListScope
    {
        /// <summary>Items owned by the user plus public items of others.</summary>
        All,
        /// <summary>Only items owned by the user.</summary>
        Owned,
        /// <summary>Only public items owned by other users.</summary>
        Others
    }
}
