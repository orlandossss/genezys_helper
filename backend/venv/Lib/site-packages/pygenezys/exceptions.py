class GenezysError(Exception):
    pass


class GenezysAuthError(GenezysError):
    def __init__(self, message, status_code=None):
        super().__init__(message)
        self.status_code = status_code


class GenezysAPIError(GenezysError):
    def __init__(self, message, status_code=None, response_text=None):
        super().__init__(message)
        self.status_code = status_code
        self.response_text = response_text


class GenezysConnectionError(GenezysError):
    pass
